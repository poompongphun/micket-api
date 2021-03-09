const mongoose = require("mongoose");

const posterSchema = new mongoose.Schema({
  images: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("poster", posterSchema);
