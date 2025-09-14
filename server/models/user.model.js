// server/models/user.model.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // The 'required: true' property has been removed from the password field.
    // This allows us to create users via Google OAuth without needing a password.
    password: {
      type: String,
    },
    // We add a field to store the unique ID we get from Google.
    googleId: {
      type: String,
    },
  },
  {
    // timestamps will automatically add 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
