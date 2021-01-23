const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const users = require("../model/users");
const bcrypt = require("bcryptjs");
const { registerValidation } = require("../validation");

const codeDigit = require("../model/codeDigit");
const nodemailer = require("nodemailer");

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

/* GET Check Duplicate Username */
router.get("/username", async (req, res) => {
  const user = await users.findOne({ username: req.query.search });
  if (user) {
    res.json({ isAvailable: false });
  } else res.json({ isAvailable: true });
});

/* GET Check Duplicate Email */
router.get("/email", async (req, res) => {
  const email = await users.findOne({ email: req.query.search });
  if (email) {
    res.json({ isAvailable: false });
  } else res.json({ isAvailable: true });
});

router.post("/forgot", async (req, res) => {
  try {
    const responseUser = await users.findOne({ email: req.body.email });
    if (responseUser) {
      const random = Math.floor(100000 + Math.random() * 900000);
      const responseCode = await codeDigit.findOneAndUpdate(
        { user_id: responseUser._id },
        { code: random.toString() },
        { new: true, upsert: true }
      );
      if (responseCode) {
        const title = "Recovery Micket Code";
        const email = responseUser.email;
        const code = responseCode.code;
        const subject = `${code} is your code`;
        const text = `Your code is ${code}`;
        const html = `Your code is <b>${code}</b>`;
        const sendMails = sendMail(title, email, subject, text, html);
        if (sendMails) {
          res.send("send email");
        }
      }
    } else res.status(400).send("not found email");
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/forgot/code", async (req, res) => {
  try {
    const responseUser = await users.findOne({ email: req.body.email });
    if (responseUser) {
      const responseCode = await codeDigit.findOne({
        user_id: responseUser._id,
        code: req.body.code,
      });
      if (responseCode) {
        res.json({ code: true });
      } else res.status(400).send("wrong code");
    } else res.status(400).send("not found email");
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/forgot/password", async (req, res) => {
  try {
    const responseUser = await users.findOne({ email: req.body.email });
    const responseCode = await codeDigit.findOne({
      user_id: responseUser._id,
      code: req.body.code,
    });
    if (responseUser && responseCode) {
      // Hash Password
      const salt = await bcrypt.genSalt(10);
      const newPass = await bcrypt.hash(req.body.newPassword, salt);

      await users
        .findByIdAndUpdate(
          responseUser._id,
          { password: newPass },
          {
            new: true,
          }
        )
        .select({ password: 0 });
      res.send("Changed Password");
    } else res.status(400).send("Something went wrong");
  } catch (error) {
    res.status(400).send(error);
  }
});

async function sendMail(title, sendTo, subject, text, htmlText) {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_NAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `${title} <${process.env.MAIL_NAME}>`, // sender address
    to: sendTo, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: htmlText, // html body
  });

  console.log("Message sent: %s", info.messageId);
  return info.messageId;
}

module.exports = router;
