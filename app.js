//require('dotenv').config({ path: `${__dirname}/common.env`})

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require("path");

const dataRoutes = require('./routes/data');
const userRoutes = require('./routes/user');
const leagueRoutes = require('./routes/leagues');
const messagesRoutes = require('./routes/messages');

console.log(`loading...`);

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  console.log(res.header);
  next();
});

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to DB');
})
.catch((e) => {
  console.log("Connection Error... " + e)
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use("/api/data", dataRoutes);
app.use("/api/user", userRoutes);
app.use("/api/league", leagueRoutes);
app.use("/api/messages", messagesRoutes);

module.exports = app;
