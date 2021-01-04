const express = require("express");
const router = express.Router();
const verify = require("../../Middleware/verifyToken");
const verifyCreator = require("../../Middleware/verifyCreator");
const sharp = require("sharp");
const fs = require("fs");
const {
  movieGroupValidation,
  editMovieGroupValidation,
} = require("../../validation");

// Model
const movieGroup = require("../../model/movieGroup");
const movieSeason = require("../../model/movieSeason");
const movies = require("../../model/movie");

// Firebase Setup
const { firebaseApp } = require("../../firebaseConfig");
const movie = require("../../model/movie");
const storage = firebaseApp.storage();
const bucket = storage.bucket();

// Get movie group
router.get("/", verifyCreator, async (req, res) => {
  const response = await movieGroup.find({ user_id: req.user._id });
  res.json(response);
});

// Get movie group by id
router.get("/:id", verifyCreator, async (req, res) => {
  const response = await movieGroup.findOne({
    _id: req.params.id,
    user_id: req.user._id,
  });
  res.json(response);
});

/* Create movie group. */
router.post("/create", verifyCreator, async (req, res) => {
  const validation = movieGroupValidation(req.body);
  if (validation.hasOwnProperty("error"))
    return res.status(400).send(validation.error.details[0].message);
  else {
    const createMovie = new movieGroup({
      user_id: req.user._id,
      title: validation.value.title,
      description: validation.value.description,
    });
    try {
      const movie = await createMovie.save();
      const createSeason = new movieSeason({
        user_id: req.user._id,
        group_id: movie._id,
      });
      await createSeason.save();
      res.status(200).send(movie);
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

// Update Movie group
router.patch("/:id", verifyCreator, async (req, res) => {
  const validation = editMovieGroupValidation(req.body);
  if (validation.hasOwnProperty("error"))
    return res.status(400).send(validation.error.details[0].message);
  else {
    try {
      const movie = await movieGroup.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        validation.value,
        {
          new: true,
        }
      );
      res.json(movie);
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

// Delete Movie Group
router.delete("/:id", verifyCreator, async (req, res) => {
  try {
    const response = await movieGroup.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });
    const responseSeason = await movieSeason.deleteMany({
      group_id: req.params.id,
      user_id: req.user._id,
    });
    const responseMovie = await movies.deleteMany({
      group_id: req.params.id,
      user_id: req.user._id,
    });
    if (response && responseSeason && responseMovie) {
      const folder = "movie";
      const id = response._id;
      console.log(id);
      const path = `${folder}/${id}/`;
      bucket.deleteFiles(
        {
          prefix: path,
        },
        (error) => {
          if (!error) {
            // All files in the `images` directory have been deleted.
            res.json({ message: "Deleted" });
          }
          res.json(error);
        }
      );
    } else res.status(400).json({ message: "Not Found" });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
