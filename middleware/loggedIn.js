const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  try {
    let token;
    try {
      token = req.headers.authorization.split(" ")[1];
    } catch {
      res
        .status(400)
        .send({ err: "Please send the token along with the payload" });
    }

    userData = jwt.verify(token, process.env.SECRET);
    if (!userData)
      return res.status(400).send({ err: "Error while authenticating" });
    req.userId = userData.userId;
    next();
  } catch (err) {
    res.status(500).send({ err: "Error while authenticating" });
  }
};
