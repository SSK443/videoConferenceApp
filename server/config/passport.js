// server/config/passport.js

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const User = require("../models/user.model");

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // The callbackURL must match the one in your Google API Console
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        // This function is called after the user successfully logs in with Google.
        // 'profile' contains the user's info from Google.

        const newUser = {
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value,
        };

        try {
          // Look for a user with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // If the user exists, we're done. Log them in.
            done(null, user);
          } else {
            // --- THIS IS THE NEW, IMPROVED LOGIC ---
            // If no user with that Google ID, check if a user with that email exists.
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              // If a user with that email exists, it's a local account.
              // We will link the Google account by adding the googleId.
              user.googleId = profile.id;
              await user.save(); // Save the updated user
              done(null, user); // Log them in
            } else {
              // If no user is found by googleId OR email, create a new user.
              user = await User.create(newUser);
              done(null, user);
            }
          }
        } catch (err) {
          console.error(err);
          done(err, null);
        }
      }
    )
  );
};
