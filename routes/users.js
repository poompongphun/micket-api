const express = require("express");
const router = express.Router();
const verify = require("../Middleware/verifyToken");
const { editUserValidation } = require("../validation");
const bcrypt = require("bcryptjs");

// Model
const users = require("../model/users");
const movieSeason = require("../model/movieSeason");

/* GET User data. */
router.get("/me", verify, async (req, res, next) => {
  try {
    const user = await users.findById(req.user._id).select({ password: 0 });
    res.json(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update User data
router.patch("/me", verify, async (req, res, next) => {
  const validation = editUserValidation(req.body);
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
    if (validation.value.hasOwnProperty("password")) {
      const salt = await bcrypt.genSalt(10);
      validation.value.password = await bcrypt.hash(
        validation.value.password,
        salt
      );
    }

    try {
      const user = await users.findByIdAndUpdate(
        req.user._id,
        validation.value,
        {
          new: true,
        }
      );
      res.send(user);
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

router.get("/me/library", verify, async (req, res) => {
  try {
    const library = await users
      .findById(req.user._id)
      .select("library")
      .populate("library");
    res.json(library);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get("/me/library/:id", verify, async (req, res) => {
  try {
    const responseSeason = await movieSeason
      .find({
        group_id: req.params.id,
      })
      .populate({
        path: "movie",
        match: { purchase_user: { $all: req.user._id } },
        select: { media: 1, name: 1 },
      })
      .select("name");
    res.json(responseSeason);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
