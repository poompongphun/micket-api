const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    immutable: true,
  },
  title: {
    type: String,
    required: true,
    min: 4,
    max: 255,
  },
  detail: {
    description: {
      type: String,
      required: false,
      min: 4,
      max: 1024,
    },
    creator: {
      type: Array,
      required: false,
    },
    star: {
      type: Array,
      required: false,
    },
    tag: {
      type: Array,
      required: false,
    },
  },
  price: {
    type: Number,
    required: false,
  },
  discount: {
    type: Number,
    required: false,
  },
  rating: {
    type: Object,
    required: false,
  },
  poster: {
    img_desktop: {
      type: String,
      required: false,
    },
    img_mobile: {
      type: String,
      required: false,
    },
  },
  video: {
    url: {
      type: String,
      required: true,
      immutable: true,
    },
    path: {
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
  release_date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("movie", movieSchema);
