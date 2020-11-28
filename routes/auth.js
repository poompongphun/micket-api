const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const users = require("../model/users");
const bcrypt = require("bcryptjs");
const { createUserValidation } = require("../validation");

/* GET users listing. */
router.post("/register", async (req, res, next) => {
  // Validate
  const validation = createUserValidation(req.body);
  if (validation.hasOwnProperty("error"))
    return res.status(400).send(validation.error.details[0].message);
  else {
    // check duplicate email
    const emailExist = await users.findOne({ email: req.body.email });
    const usernameExist = await users.findOne({ username: req.body.username });
    if (emailExist) return res.status(400).send("Email already exists");
    else if (usernameExist)
      return res.status(400).send("Username already exists");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const user = new users({
      username: req.body.username,
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    try {
      const createUser = await user.save();
      res.send({ user: createUser._id });
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

module.exports = router;
