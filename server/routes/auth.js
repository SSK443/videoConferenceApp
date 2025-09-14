// server/routes/auth.js

const router = require("express").Router();
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport"); // Import passport for Google OAuth

// =======================================================
// --- LOCAL REGISTRATION ROUTE (From Day 3) ---
// =======================================================
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }
    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ msg: "User with this email or username already exists." });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Create and save new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    const savedUser = await newUser.save();
    res.status(201).json({
      msg: "User registered successfully!",
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// =======================================================
// --- LOCAL LOGIN ROUTE (From Day 4) ---
// =======================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    // User is valid, create JWT
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({
          msg: "Logged in successfully!",
          token,
          user: { id: user.id, username: user.username, email: user.email },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// =======================================================
// --- NEW: GOOGLE OAUTH ROUTES (For Day 5) ---
// =======================================================

// @desc    Auth with Google - The first step.
// @route   GET /api/auth/google
// When the user clicks "Login with Google", the front-end will direct them to this URL.
// Passport then takes over and redirects them to Google's official login page.
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // We ask Google for the user's profile info and email
  })
);

// @desc    Google auth callback - The second step.
// @route   GET /api/auth/google/callback
// After the user logs in with Google, Google will redirect them back to THIS URL.
router.get(
  "/google/callback",
  // Passport tries to authenticate the user based on the info Google provides.
  // If it fails (e.g., the user cancels), it redirects them to the front-end login page.
  // 'session: false' tells Passport not to use old-style server sessions. We are using JWTs!
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000",
    session: false,
  }),
  (req, res) => {
    // If the authentication was successful, Passport puts the user's data on `req.user`.
    // This `user` comes from the `done(null, user)` call in our passport.js config file.
    const user = req.user;

    // Now we create our own JWT for the user, just like in the regular login.
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        // This is the final step. We redirect the user back to our React app.
        // We include the token in the URL so the React app can grab it and log the user in.
        res.redirect(`http://localhost:3000?token=${token}`);
      }
    );
  }
);

module.exports = router;
