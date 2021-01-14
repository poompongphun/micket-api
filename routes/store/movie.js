const express = require("express");
const router = express.Router();
const verify = require("../../Middleware/verifyToken");
const noVerify = require("../../Middleware/noVerify");

// Model
const movieGroup = require("../../model/movieGroup");
const movieSeason = require("../../model/movieSeason");
const movie = require("../../model/movie");
const users = require("../../model/users");

// Get all public movie 
router.get("/", async (req, res) => {
  try {
    const response = await movieGroup
      .find({
        public: true,
      })
      .populate({ path: "user_id", select: "name" })
      .lean();

    // count owned user
    const result = await Promise.all(
      response.map(async (movie) => {
        const ownedUser = await users
          .find({
            library: { $in: movie._id },
          })
          .select("library");
        const movieObject = Object.assign({}, movie);
        movieObject.owned_user = ownedUser.length;
        return movieObject;
      })
    );
    res.json(result);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get Movie by group id
router.get("/:id", noVerify, async (req, res) => {
  try {
    // find group
    const response = await movieGroup
      .findOne({
        _id: req.params.id,
        public: true,
      })
      .populate({ path: "user_id", select: "name" })
      .lean();

    if (response && req.user) {
      // reduce price in user have some movie in this group
      const findPrice = await movie
        .find({
          group_id: req.params.id,
          public: true,
          purchase_user: { $ne: req.user._id },
        })
        .select("price");
      let initialValue = 0;
      const sumPrice = findPrice.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.price;
      }, initialValue);
      response.price = sumPrice;
    }

    // if quest show all movie
    // if user show only movie that user didnt buy
    const match = req.user
      ? { public: true, purchase_user: { $ne: req.user._id } }
      : { public: true };

    const responseSeason = await movieSeason
      .find({
        group_id: response._id,
      })
      .select({ name: 1, _id: 0 })
      .populate({
        path: "movie",
        select: ["media.thumbnail", "name", "price", "upload_date", "group_id"],
        match: match,
      });

    // Check if no more movie to buy that mean owned
    const owned = responseSeason.every((season) => season.movie.length === 0);
    const movieOwn = Object.assign(response, { isOwned: owned });

    res.json({ movie: movieOwn, season: responseSeason });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
