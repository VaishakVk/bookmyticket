const Sequelize = require("sequelize");
const db = require("../config/db");

const Booking = db.define("bookings", {
  userId: {
    type: Sequelize.INTEGER,
    references: {
      model: "users",
      key: "userId"
    }
  },
  orderAmount: {
    type: Sequelize.INTEGER
  },
  orderAmount: {
    type: Sequelize.INTEGER
  },
  seats: {
    type: Sequelize.INTEGER
  },
  showId: {
    type: Sequelize.INTEGER,
    references: {
      model: "shows",
      key: "showId"
    }
  },
  BookingId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
});

module.exports = Booking;
