const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { mongoConnect } = require("./services/mongo.services");
require("dotenv").config();
const uri = process.env.URI;

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
    await mongoConnect();
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

    res.status(201).json({ token, userId: generateUserId });
  } catch (error) {
    res.send(error);
  } finally {
    await client.close();
  }
});

app.post("/login", async (req, res) => {
  await mongoConnect();
  const { email, password } = req.body;

  try {
    const database = client.db("app-data");
    const users = database.collection("users");
    const user = await users.findOne({ email });

    const correctPassword = await bcrypt.compare(
      password,
      user.hashed_password
    );

    if (user && correctPassword) {
      const token = jwt.sign(user, email, {
        expiresIn: 60 * 24,
      });

      res.status(201).json({ token, userId: user.user_id });
    }

    res.status(400).send("Invalid Credentials");
  } catch (error) {
    console.log(error);
  }
});

app.get("/users", async (req, res) => {
  const userIds = JSON.parse(req.query.userIds).map((obj) => obj.matchedUserId);

  try {
    await mongoConnect();

    const database = client.db("app-data");
    const users = database.collection("users");

    const pipeline = [
      {
        $match: {
          user_id: {
            $in: userIds,
          },
        },
      },
    ];

    const foundUsers = await users.aggregate(pipeline).toArray();
    res.send(foundUsers);
  } catch (error) {
    console.log("server", error);
  } finally {
    await client.close();
  }
});

app.get("/gendered-users", async (req, res) => {
  const gender = req.query.gender;

  // console.log("gender", gender);
  try {
    await mongoConnect();
    const database = client.db("app-data");

    const users = database.collection("users");
    const query = { gender_identity: { $eq: gender } };

    const foundUsers = await users.find(query).toArray();

    res.send(foundUsers);
  } catch (error) {
    res.send(error);
  } finally {
    await client.close();
  }
});

app.get("/user", async (req, res) => {
  await mongoConnect();
  const UserId = req.query.userId;

  try {
    const database = client.db("app-data");
    const users = database.collection("users");
    const query = { user_id: UserId };

    const user = await users.findOne(query);
    res.send(user);
  } catch (error) {
    console.log(error);
  } finally {
    await client.close();
  }
});

app.put("/user", async (req, res) => {
  const formData = req.body.formData;

  try {
    await mongoConnect();
    const database = client.db("app-data");
    const users = database.collection("users");

    const query = { user_id: formData.user_id };

    const updateDocument = {
      $set: {
        first_name: formData.first_name,
        dob_day: formData.dob_day,
        dob_month: formData.dob_month,
        dob_year: formData.dob_year,
        show_gender: formData.show_gender,
        gender_identity: formData.gender_identity,
        gender_interest: formData.gender_interest,
        url: formData.url,
        about: formData.about,
        matches: formData.matches,
      },
    };

    const insertedUser = await users.updateOne(query, updateDocument);
    res.send(insertedUser);
  } catch (error) {
    console.log(error);
  } finally {
    await client.close();
  }
});

app.put("/addmatch", async (req, res) => {
  const { userId, matchedUserId } = req.body;

  try {
    await mongoConnect();
    const database = client.db("app-data");
    const users = database.collection("users");

    const query = { user_id: userId };
    const updateDocument = {
      $push: {
        matches: {
          user_id: { matchedUserId },
        },
      },
    };

    const user = await users.updateOne(query, updateDocument);

    res.send(user);
  } catch (error) {
    console.log(error);
  } finally {
    await client.close();
  }
});

app.get("/messages", async (req, res) => {
  const { userId, correspondingUserId } = req.query;
  try {
    await mongoConnect();

    const database = client.db("app-data");
    const messages = database.collection("messages");

    const query = {
      from_userId: userId,
      to_userId: correspondingUserId,
    };

    const foundMessages = await messages.find(query).toArray();
    res.send(foundMessages);
  } catch (error) {
    console.log(error);
  } finally {
    await client.close();
  }
});

app.post("/message", async (req, res) => {
  const message = req.body;

  try {
    await mongoConnect();

    const database = client.db("app-data");
    const messages = database.collection("messages");
    const insertedMessage = await messages.insertOne(message);

    res.send(insertedMessage);
  } catch (error) {
    console.log(error);
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => {
  console.log("Server started on PORT " + PORT);
});
