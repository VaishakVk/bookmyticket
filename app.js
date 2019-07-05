const express = require("express");
const bodyParser = require("body-parser");

const db = require("./config/db");

const authroutes = require("./routes/auth");
const showroutes = require("./routes/shows");

const port = process.env.PORT || 3000;

db.authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
require("dotenv").config();
app.use("/api", authroutes);
app.use("/api/shows", showroutes);

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
