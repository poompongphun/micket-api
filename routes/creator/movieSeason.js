const express = require("express");
const router = express.Router();
const verifyCreator = require("../../Middleware/verifyCreator");
const movieGroup = require("../../model/movieGroup");

// Model
const movieSeason = require("../../model/movieSeason");

// Get season
router.get("/:season_id", verifyCreator, async (req, res) => {
  try {
    const response = await movieSeason
      .findOne({
        _id: req.params.season_id,
        user_id: req.user._id,
      })
      .populate("movie");
    res.json(response);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/:season_id", verifyCreator, async (req, res) => {
  const responseMovie = await movieSeason
    .findOne({ _id: req.params.season_id, user_id: req.user._id })
    .select({ movie: 1, group_id: 1 });
  if (responseMovie.movie.length === 0) {
    const isFristSeason = await movieSeason.find({
      group_id: responseMovie.group_id,
    });
    if (isFristSeason.length > 1) {
      const response = await movieSeason.findOneAndDelete({
        _id: req.params.season_id,
        user_id: req.user._id,
      });
      res.json(response);
    } else res.status(400).send("you cant remove frist season");
  } else res.status(400).send("still have movie in this season");
});

/* Create Season. */
router.post("/:group_id", verifyCreator, async (req, res) => {
  const checkGroup = movieGroup.findOne({
    user_id: req.user._id,
    _id: req.params.group_id,
  });
  if (checkGroup) {
    try {
      const createSeason = new movieSeason({
        user_id: req.user._id,
        group_id: req.params.group_id,
        name: req.body.name,
      });
      const response = await createSeason.save();
      res.json(response);
    } catch (error) {
      res.status(400).send(error);
    }
  } else {
    res.status(400).send("not found group");
  }
});

module.exports = router;
