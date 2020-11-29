const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const users = require("../model/users");
const bcrypt = require("bcryptjs");
const { registerValidation } = require("../validation");
const { route } = require(".");

/* GET users listing. */
router.post("/register", async (req, res, next) => {
  // Validate
  const validation = registerValidation(req.body);
  if (validation.hasOwnProperty("error"))
    return res.status(400).send(validation.error.details[0].message);
  else {
    // Format Data
    const usernameFormat = await req.body.username.toLowerCase()
    const emailFormat = await req.body.email.toLowerCase()
    const nameFormat = await req.body.name.replace( /  +/g, ' ' )

    // check duplicate email
    const emailExist = await users.findOne({ email: emailFormat });
    const usernameExist = await users.findOne({ username: usernameFormat });
    if (emailExist) return res.status(400).send("Email already exists");
    else if (usernameExist)
      return res.status(400).send("Username already exists");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const user = new users({
      username: usernameFormat,
      name: nameFormat,
      email: emailFormat,
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

router.post("/login", async (req, res) => {
  // Check Exist Email
  const user = await users.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Email or Password is wrong");

  // Check Password
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.status(400).send("Email or Password is wrong");

  // Create Token
  const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY, { expiresIn: '7d' });
  res.header('authorization', token).send(token);
});

module.exports = router;
