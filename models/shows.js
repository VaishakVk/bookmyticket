const Sequelize = require("sequelize");
const db = require("../config/db");

const Show = db.define("shows", {
  time: {
    type: Sequelize.STRING
  },
  basePrice: {
    type: Sequelize.INTEGER
  },
  seats: {
    type: Sequelize.ARRAY(Sequelize.STRING)
  },
  totalSeats: {
    type: Sequelize.INTEGER
  },
  currentPrice: {
    type: Sequelize.INTEGER
  },
  showId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
});

module.exports = Show;
