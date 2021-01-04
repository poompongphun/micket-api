const express = require("express");
const router = express.Router();
const verifyCreator = require("../../Middleware/verifyCreator");

// Model
const movieSeason = require("../../model/movieSeason");

// Get season
router.get("/:season_id", verifyCreator, async (req, res) => {
  const response = await movieSeason
    .findOne({
      _id: req.params.season_id,
      user_id: req.user._id,
    })
    .populate("movie");
  res.json(response);
});

router.delete("/:season_id", verifyCreator, async (req, res) => {
  const response = await movieSeason
    .findOneAndDelete({
      _id: req.params.season_id,
      user_id: req.user._id,
    })
    .populate("movie");
  res.json(response);
});

/* Create Season. */
router.post("/:group_id", verifyCreator, async (req, res) => {
  const createSeason = new movieSeason({
    user_id: req.user._id,
    group_id: req.params.group_id,
    name: req.body.name,
  });
  const response = await createSeason.save();
  res.json(response);
});

module.exports = router;
