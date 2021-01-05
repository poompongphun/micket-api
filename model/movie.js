const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    immutable: true,
    ref: "users",
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    immutable: true,
    ref: "movieGroup",
  },
  season_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    immutable: true,
    ref: "movieSeason",
  },
  name: {
    type: String,
    required: true,
    min: 4,
    max: 255,
  },
  price: {
    type: Number,
    required: false,
    default: 0,
  },
  media: {
    thumbnail: {
      type: String,
      required: false,
    },
    video: {
      type: String,
      required: true,
      immutable: true,
    },
    fileName: {
      type: String,
      required: true,
      immutable: true,
    },
  },
  public: {
    type: Boolean,
    required: false,
    default: false,
  },
  upload_date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("movie", movieSchema);
