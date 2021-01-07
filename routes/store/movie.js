const express = require("express");
const router = express.Router();
const verify = require("../../Middleware/verifyToken");

// Model
const movieGroup = require("../../model/movieGroup");
const movieSeason = require("../../model/movieSeason");

// Get Movie by id
router.get("/", async (req, res) => {
  try {
    const response = await movieGroup
      .find({
        public: true,
      })
      .populate({ path: "user_id", select: "name" });
    res.json(response);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get Movie by id
router.get("/:id", async (req, res) => {
  try {
    const response = await movieGroup
      .findOne({
        _id: req.params.id,
        public: true,
      })
      .populate({ path: "user_id", select: "name" });
    const responseSeason = await movieSeason
      .find({
        group_id: response._id,
      })
      .select({ name: 1, _id: 0 })
      .populate({
        path: "movie",
        select: ["media.thumbnail", "name", "price", "upload_date"],
        match: { public: true },
      });
    res.json({ movie: response, season: responseSeason });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
