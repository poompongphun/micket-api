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
router.get("/", noVerify, async (req, res) => {
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

        // count like/dislike and check user like
        movieObject.like = countLike(movie, req.user);

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

    // count like/dislike and check user like
    movieOwn.like = countLike(response, req.user);

    res.json({ movie: movieOwn, season: responseSeason });
  } catch (error) {
    res.status(400).send(error);
  }
});

// like by group id
router.post("/:id/like", verify, async (req, res) => {
  try {
    const responseMovie = await movie
      .find({ group_id: req.params.id, purchase_user: { $in: req.user._id } })
      .select("purchase_user");
    if (responseMovie.length !== 0) {
      const checkLike = await dolikeGroup(req.params.id, req.user._id, true);
      res.json("liked");
    } else res.status(400).send("you need to buy movie frist");
  } catch (error) {
    res.status(400).send(error);
  }
});

// dislike by group id
router.post("/:id/dislike", verify, async (req, res) => {
  try {
    const responseMovie = await movie
      .find({ group_id: req.params.id, purchase_user: { $in: req.user._id } })
      .select("purchase_user");
    if (responseMovie.length !== 0) {
      const checkLike = await dolikeGroup(req.params.id, req.user._id, false);
      res.json("disliked");
    } else res.status(400).send("you need to buy movie frist");
  } catch (error) {
    res.status(400).send(error);
  }
});

// dislike by group id
router.delete("/:id/removelike", verify, async (req, res) => {
  try {
    const responseMovie = await movie
      .find({ group_id: req.params.id, purchase_user: { $in: req.user._id } })
      .select("purchase_user");
    if (responseMovie.length !== 0) {
      const checkLike = await movieGroup.findOneAndUpdate(
        {
          _id: req.params.id,
          "like.user_id": { $in: req.user._id },
        },
        { $pull: { like: { user_id: req.user._id } } },
        {
          new: true,
          useFindAndModify: false,
        }
      );
      res.json("removed like");
    } else res.status(400).send("you need to buy movie frist");
  } catch (error) {
    res.status(400).send(error);
  }
});

async function dolikeGroup(id, user_id, islike) {
  const option = {
    new: true,
    useFindAndModify: false,
  };
  const find = await movieGroup.findOne({
    _id: id,
    "like.user_id": { $in: user_id },
  });
  if (find) {
    const updateLike = await movieGroup.findOneAndUpdate(
      {
        _id: id,
        "like.user_id": { $in: user_id },
      },
      {
        $set: { "like.$.islike": islike },
      },
      option
    );
    return updateLike;
  } else {
    const addLike = await movieGroup.findByIdAndUpdate(
      id,
      {
        $addToSet: { like: { user_id: user_id, islike: islike } },
      },
      option
    );
    return addLike;
  }
}

function countLike(movieGroup, reqUser) {
  const isLike =
    movieGroup.like.length !== 0 &&
    reqUser &&
    movieGroup.user_id._id != reqUser._id
      ? movieGroup.like.filter((like) => like.user_id == reqUser._id)
      : null;
  const like = movieGroup.like.filter((like) => like.islike == true);
  const dislike = movieGroup.like.filter((like) => like.islike == false);
  console.log(isLike);
  const likeDetail = {
    islike:
      movieGroup.like.length !== 0 &&
      reqUser &&
      movieGroup.user_id._id != reqUser._id
        ? isLike.length !== 0
          ? isLike[0].islike
          : null
        : isLike,
    like: like.length,
    dislike: dislike.length,
  };
  return likeDetail
}

module.exports = router;
