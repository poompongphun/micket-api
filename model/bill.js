const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    immutable: true,
    ref: "users",
  },
  order: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "movie",
    },
  ],
  order_group: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    immutable: true,
    ref: "movieGroup",
  },
  status: {
    type: Boolean,
    required: false,
    default: false,
  },
  create_date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("bill", billSchema);
