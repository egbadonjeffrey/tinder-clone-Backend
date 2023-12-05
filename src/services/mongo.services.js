const { MongoClient } = require("mongodb");
// TODO Update MongoDB Atlas password because .env is pushed to GitHub
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL);

async function mongoConnect() {
  await client.connect(err => {
    if (err) return console.error('Error connecting to MongoDB:', err)
    })
    return
}

async function mongoDisconnect() {
    await client.disconnect(err => {
        if (err) return console.error('Error closing MongoDB connection:', err)
        })
    return  
}

module.exports = {
  mongoConnect,
  mongoDisconnect,
}


