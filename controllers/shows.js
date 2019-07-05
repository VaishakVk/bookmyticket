const Sequelize = require("sequelize");
const Show = require("../models/shows");
const Booking = require("../models/booking");
const Op = Sequelize.Op;

generateTimeString = () => {
  const today = new Date();
  const hr = ("0" + today.getHours()).slice(-2);
  const min = ("0" + today.getMinutes()).slice(-2);

  const yr = today.getFullYear();
  const mon = ("0" + (today.getMonth() + 1)).slice(-2);
  const date = ("0" + today.getDate()).slice(-2);

  return { time: hr + min, date: yr + mon + date };
};

exports.getShowDetails = (req, res, next) => {
  const timeDetails = generateTimeString();

  Show.findAll({
    attributes: ["time", "currentPrice"],
    where: { time: { [Op.gte]: timeDetails.date.concat(timeDetails.time) } }
  })
    .then(data => res.status(200).send(data))
    .catch(err => res.status(500).send(err));
};

exports.postRegisterShow = (req, res, next) => {
  const { time, basePrice, seats } = req.body;
  const timeDetails = generateTimeString();
  let totalSeats = 0;

  if (time < timeDetails.time)
    return res.status(400).send({
      message: "Time elapsed. Please come tomorrow to register the show"
    });

  const seatRegex = /R\d+:\[[0-9,]+\]/g;
  const seatLayout = seats.match(seatRegex);
  const seatArray = [];

  seatLayout.forEach(seat => {
    // Generate a Regex to parse the input format.
    let splitdata = seat.split(":");
    let row = parseInt(splitdata[0].substring(1), 10);
    let seatRow = splitdata[1];
    let seatData = JSON.parse(seatRow);
    totalSeats += seatData.filter(x => x === 1).length;
    seatArray[row - 1] = seatRow;
  });

  // ASSUMPTION: 3 hours duration between each show.
  // Since date is in YYYYMMDDHHMI absolute difference of 300 would avoid overlapping
  Show.findOne({
    where: {
      time: {
        [Op.between]: [
          timeDetails.date.concat(parseInt(time) - 299),
          timeDetails.date.concat(parseInt(time) + 299)
        ]
      }
    }
  })
    .then(shows => {
      if (shows !== null)
        return Promise.reject({
          message: "Overlapping shows. Please recheck the timing"
        });
    })
    .then(() => {
      return Show.create({
        seats: seatArray,
        time: timeDetails.date + time,
        basePrice,
        currentPrice: basePrice,
        totalSeats
      });
    })
    .then(showData =>
      res.status(201).send({ message: "Show registered successfully" })
    )
    .catch(err => res.status(500).send({ error: err.message }));
};

exports.getShowDetailsByTime = (req, res, next) => {
  const { time } = req.params;
  const timeDetails = generateTimeString();
  const seats = [];
  Show.findOne({ where: { time: timeDetails.date.concat(time) } })
    .then(show => {
      if (!show) res.status(404).send({ error: "Show does not exist" });

      const rows = show.seats;
      rows.forEach(row => {
        seats.push(
          row
            .replace(/1/g, "*")
            .replace(/0/g, ".")
            .replace(/9/g, "#")
            .replace(/[\[\]]/g, "")
        );
      });
    })
    .then(() => {
      res.status(200).send(seats.join("\n"));
    })
    .catch(err => res.status(500).send({ error: err }));
};

exports.postBookShow = (req, res, next) => {
  let showInfo;
  let orderAmount;
  const { seats, time } = req.body;
  const timeDetails = generateTimeString();
  const errors = [];
  const success = [];

  //Converting HHMI to seconds to check if the time has elapsed 30 minute cutoff time
  const totalMinutes =
    timeDetails.time.substring(0, 2) * 60 + timeDetails.time.substring(2);
  const totalParamMinutes = time.substring(0, 2) * 60 + time.substring(2);

  Show.findOne({ where: { time: timeDetails.date.concat(time) } })
    .then(showdata => {
      if (showdata === null)
        return Promise.reject({
          status: 404,
          message: "Show does not exist at that time"
        });
      if (totalParamMinutes - 30 < totalMinutes)
        return Promise.reject({
          status: 400,
          message: "Booking cutoff time is reached"
        });

      //Generate a random nmber between 0 to 1.
      //If value is less than 0.05, booking will fail
      random_number = Math.random();

      if (random_number < 0.05)
        return Promise.reject({
          message: "Error: Booking not complete"
        });

      const seatRegex = /R\d+#[0-9]+/g;
      const seatLayout = seats.match(seatRegex);

      seatLayout.forEach(seat => {
        let splitdata = seat.split("#");
        let row = parseInt(splitdata[0].substring(1), 10) - 1;
        let seatNumber = parseInt(splitdata[1], 10);
        if (row < 0 || row > showdata.seats.length) {
          errors.push(`Row ${row + 1} is invalid. Please try a different seat`);
          return;
        }
        rowArray = JSON.parse(showdata.seats[row]);
        if (rowArray[seatNumber] == 1) {
          rowArray[seatNumber] = 9;
          rowArray = "[" + rowArray.toString() + "]";
          showdata.seats[row] = rowArray;

          success.push(
            `Row ${row + 1} Seat Number ${seatNumber} is booked successfully.`
          );
        } else if (rowArray[seatNumber] == 9) {
          errors.push(
            `Row ${row +
              1} Seat Number ${seatNumber} is already booked. Please try a different seat`
          );
        } else {
          errors.push(
            `Invalid seat selection - Row ${row + 1} Seat Number ${seatNumber}`
          );
        }
      });

      if (success.length == 0)
        return Promise.reject({ status: 400, message: errors });

      showInfo = showdata;
      orderAmount = success.length * showInfo.currentPrice;

      return Show.update(
        { seats: showdata.seats },
        { where: { showId: showdata.showId } }
      );
    })
    .then(() => {
      // Timeout of 5 seconds to imitate original order booking
      setTimeout(() => {
        res.status(200).send({ success, error: errors });
      }, 5000);
    })
    .then(() => {
      return Booking.create({
        orderAmount,
        showId: showInfo.showId,
        userId: 2,
        seats: success.length
      });
    })
    .then(() => {
      // Check for dynamic price hike
      Show.hasMany(Booking, { foreignKey: "showId" });
      Booking.belongsTo(Show, { foreignKey: "showId" });
      return Booking.findOne({
        attributes: [
          [
            Sequelize.fn("sum", Sequelize.col("bookings.seats")),
            "bookedTickets"
          ]
        ],
        include: [
          {
            model: Show,
            attributes: ["time"],
            where: [{ time: timeDetails.date.concat(time) }]
          }
        ],
        group: ["show.time"],
        raw: true
      });
    })
    .then(data => {
      const { bookedTickets } = data;
      const previousPercentage = Math.ceil(
        ((bookedTickets - success.length) / showInfo.totalSeats) * 10
      );
      const currentPercentage = Math.ceil(
        (bookedTickets / showInfo.totalSeats) * 10
      );

      if (previousPercentage + 1 === currentPercentage) {
        showInfo.currentPrice = Math.round(showInfo.currentPrice * 1.15);

        Show.update(
          { currentPrice: showInfo.currentPrice },
          { where: { showId: showInfo.showId } }
        );
      }
    })
    .catch(err => {
      res.status(err.status || 500).send({ error: err.message });
    });
};

exports.getShowStats = (req, res, next) => {
  const { time } = req.params;
  const timeDetails = generateTimeString();

  timeSearch = timeDetails.date + time;
  Show.hasMany(Booking, { foreignKey: "showId" });
  Booking.belongsTo(Show, { foreignKey: "showId" });

  Booking.findAll({
    attributes: [
      [Sequelize.fn("sum", Sequelize.col("orderAmount")), "total"],
      [Sequelize.fn("sum", Sequelize.col("bookings.seats")), "bookedTickets"],
      "show.time"
    ],
    include: [
      {
        model: Show,
        attributes: ["time"],
        where: [{ time: timeSearch }]
      }
    ],
    group: ["show.time"],
    raw: true
  })
    .then(data => {
      if (!data) res.status(404).send({ err: "Show details not found" });
      res.status(200).send({ data });
    })
    .catch(err => res.status(500).send({ err: err.message }));
};
