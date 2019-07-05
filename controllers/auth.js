const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

userExists = email => {
  return new Promise((resolve, reject) => {
    User.findOne({ where: { email: email.toLowerCase() } })
      .then(data => {
        if (data === null) resolve(false);
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
};

exports.postSignUp = (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;
  const errors = [];
  const emailRegex = /\w{4,}@\w+\.\w{2,5}/gi;

  // Not NULL validation
  if (!username)
    errors.push({ field: "username", message: "Username is required" });
  if (!email) errors.push({ field: "email", message: "Email is required" });
  if (!password)
    errors.push({ field: "password", message: "Password is required" });
  if (!confirmPassword)
    errors.push({ field: "confirmPassword", message: "Password is required" });
  if (confirmPassword && password && confirmPassword !== password)
    errors.push({ field: "password", message: "Passwords do not match" });
  if (email && !emailRegex.test(email))
    errors.push({ field: "email", message: "Invalid Email format" });

  // Send errors if exists
  if (errors.length > 0) return res.status(400).send(errors);

  //   Check for user
  userExists(email).then(result => {
    if (result)
      return res
        .status(400)
        .send({ field: "email", message: "User already exists" });

    // Hash Password
    bcrypt.hash(password, 10, (err, hash) => {
      User.create({
        email: email.toLowerCase(),
        name: username,
        password: hash
      })
        .then(data => {
          return res.status(201).send({ message: "User created successfully" });
        })
        .catch(err => res.status(500).send({ err }));
    });
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Not NULL check
  if (!email) errors.push({ field: "email", message: "Email is required" });
  if (!password)
    errors.push({ field: "password", message: "Password is required" });

  if (errors.length > 0) return res.status(400).send(errors);

  userExists(email).then(userData => {
    if (!userData)
      return res
        .status(400)
        .send({ field: "email", message: "User does not exist" });

    // Verify Passwords
    bcrypt.compare(password, userData.password, (err, match) => {
      if (err) return res.status(400).send(err);
      if (!match) {
        return res.status(400).send({ error: "Passwords do not match" });
      }
      // Create JWT token
      jwt.sign(
        { user: userData.email, id: userData.userId },
        process.env.SECRET,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) res.status(500).send({ error: err });
          res.status(200).send({ token });
        }
      );
    });
  });
};
