const mongoose = require("mongoose");

const movieGroupSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    immutable: true,
    ref: "users",
  },
  title: {
    type: String,
    required: true,
    min: 4,
    max: 255,
  },
  description: {
    type: String,
    required: false,
    max: 1024,
  },
  detail: {
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
  poster: {
    x: {
      type: String,
      required: false,
      default: "",
    },
    y: {
      type: String,
      required: false,
      default: "",
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
  public: {
    type: Boolean,
    required: false,
    default: false,
  },
  create_date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("movieGroup", movieGroupSchema);
