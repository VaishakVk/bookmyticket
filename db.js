const Show = require("./models/shows");
const User = require("./models/user");
const Booking = require("./models/booking");

Show.sync();
Booking.sync();
User.sync();

Show.hasMany(Booking, { foreignKey: "showId" });
Booking.belongsTo(Show, { foreignKey: "showId" });
