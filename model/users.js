const { boolean } = require("@hapi/joi");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 4,
    max: 255,
  },
  name: {
    type: String,
    required: true,
    min: 4,
    max: 255,
  },
  email: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  password: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  coins: {
    type: Number,
    required: false,
    default: 0,
  },
  creator: {
    type: Boolean,
    required: true,
    default: false,
  },
  library: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "movieGroup",
    },
  ],
  join_date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("users", userSchema);
