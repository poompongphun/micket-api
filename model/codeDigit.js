const mongoose = require("mongoose");

const codeDigitSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    immutable: true,
    ref: "users",
  },
  code: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("codeDigit", codeDigitSchema);
