const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const users = require("../model/users");
const bcrypt = require("bcryptjs");
const { registerValidation } = require("../validation");

/* GET users listing. */
router.post("/register", async (req, res, next) => {
  // Validate
  const validation = registerValidation(req.body);
  if (validation.hasOwnProperty("error"))
    return res.status(400).send(validation.error.details[0].message);
  else {
    // check duplicate email / username
    const emailExist = await users.findOne({ email: validation.value.email });
    const usernameExist = await users.findOne({
      username: validation.value.username,
    });
    if (emailExist) return res.status(400).send("Email already exists");
    else if (usernameExist)
      return res.status(400).send("Username already exists");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const user = new users({
      username: validation.value.username,
      name: validation.value.name,
      email: validation.value.email,
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
  const errorMessage = "Email or Password is wrong";
  // Check Exist Email
  const user = await users.findOne({ email: req.body.email });
  if (user) {
    // Check Password
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (validPass) {
      // Create Token
      const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY, {
        expiresIn: "7d",
      });

      // remove password (hide password) before send
      const removeKey = ["password", "__v"];
      removeKey.forEach((key) => (user[key] = undefined));

      // send user detail and token after login success
      res
        .header("authorization", token)
        .send({ user: user, access_token: token });
    } else return res.status(400).send(errorMessage);
  } else return res.status(400).send(errorMessage);
});

module.exports = router;
