const Sequelize = require("sequelize");
require("dotenv").config();

module.exports = new Sequelize(
  "ticketBooking",
  "postgres",
  process.env.POSTGREPASSWORD,
  {
    host: "localhost",
    dialect: "postgres"
  }
);
