const mongoose = require("mongoose");

const movieSeasonSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    default: "Season 1",
  },
  movie: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "movie",
    },
  ],
});

module.exports = mongoose.model("movieSeason", movieSeasonSchema);
