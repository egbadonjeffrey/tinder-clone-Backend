const express = require("express");
const app = express();
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://egbadonjeffrey:Godis.ancient0@cluster0.bcnddou.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

const PORT = 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json("Hello My Backend has started");
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const generateUserId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await client.connect();
    const database = client.db("app-data");
    const users = database.collection("users");
    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res.status(409).send("User already exists with this email!");
    }

    const sanitizedEmail = email.toLowerCase();
    const data = {
      user_id: generateUserId,
      email: sanitizedEmail,
      hashed_password: hashedPassword,
    };

    const insertedUser = await users.insertOne(data);
    const token = jwt.sign(insertedUser, sanitizedEmail, {
      expiresIn: 60 * 24,
    });

    res
      .status(201)
      .json({ token, userId: generateUserId, email: sanitizedEmail });
  } catch (error) {
    res.send(error);
  } finally {
    await client.close();
  }
});

app.post("/login", async (req, res) => {
  await client.connect();
  const { email, password } = req.body;

  try {
    const database = client.db("app-data");
    const users = database.collection("users");
    const user = await users.findOne({ email });

    console.log(user.hashed_password);
    const correctPassword = await bcrypt.compare(
      password,
      user.hashed_password
    );

    if (user && correctPassword) {
      const token = jwt.sign(user, email, {
        expiresIn: 60 * 24,
      });

      res.status(201).json({ token, userId: user.user_id, email });
    }

    res.status(400).send("Invalid Credentials");
  } catch (error) {
    console.log(error);
  }
});

app.get("/users", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("app-data");

    const users = database.collection("users");

    const returnedUsers = await users.find().toArray();
    res.send(returnedUsers);
  } catch (error) {
    res.send(error);
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => {
  console.log("Server started on PORT " + PORT);
});
