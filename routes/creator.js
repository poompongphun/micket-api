const express = require("express");
const router = express.Router();
const verify = require("./verifyToken");
const users = require("../model/users");

const price = 9.99;
/* GET Price. */
router.get("/join-price", async (req, res, next) => {
  res.json({
    price: price,
  });
});

router.post("/join", verify, async (req, res, next) => {
  const user = await users.findById(req.user._id).select({ coins: 1, _id: 0 });
  const response = await users
    .findByIdAndUpdate(
      req.user._id,
      { coins: parseFloat(user.coins - price).toFixed(2), creator: true },
      {
        new: true,
        useFindAndModify: false,
      }
    )
    .select({ creator: 1, _id: 0 });

  res.json({
    status: "success",
    message: response,
  });
});

router.delete("/join", verify, async (req, res, next) => {
  const response = await users
    .findByIdAndUpdate(
      req.user._id,
      { creator: false },
      {
        new: true,
        useFindAndModify: false,
      }
    )
    .select({ creator: 1, _id: 0 });

  res.json({
    status: "success",
    message: response,
  });
});

module.exports = router;
