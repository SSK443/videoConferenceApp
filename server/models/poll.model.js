// server/models/poll.model.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const optionSchema = new Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
  voters: [{ type: String }], // Store userIds of who voted for this option
});

const pollSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: [optionSchema],
    roomId: {
      type: String,
      required: true,
    },
    createdBy: {
      username: { type: String, required: true },
      userId: { type: String, required: true },
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Poll = mongoose.model("Poll", pollSchema);

module.exports = Poll;
