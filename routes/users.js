const express = require("express");
const router = express.Router();
const verify = require("./verifyToken");
const users = require("../model/users");

/* GET User data. */
router.get("/me", verify, async (req, res, next) => {
  try {
    const user = await users.findById(req.user._id);
    const removeKey = ['password', '__v']
    removeKey.forEach(key => user[key] = undefined);
    res.json(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update User data
router.patch('/me', verify, async (req, res, next) => {

})

module.exports = router;
