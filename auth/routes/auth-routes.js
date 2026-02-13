const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
// const currentUser = require("../../common/middlewares/current-user");
const {currentUser, requireAuth} = require('@ganeshsurnaticketingapp/common')

const router = express.Router();

// GET /api/users/currentuser
router.get("/currentuser", currentUser, async (req, res, next) => {
  return res.json({ currentUser: req.currentUser });
});

// POST /api/users/signup
router.post(
  "/signup",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .isLength({ min: 4, max: 20 })
      .withMessage("Password must be between 4 and 20 characters long"),
  ],
  async (req, res, next) => {
    console.log({body: req.body})
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // throw new RequestValidationError(errors.array());
      return res.status(400).json({
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }
    const { email, password } = req.body;
    const userFound = await User.findOne({ email: email });

    if (!userFound) {
      console.log('No user found')
      // Hash the password before saving it to the database
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = new User({ email: email, password: hashedPassword });
      await user.save();

      // Generate JWT token
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        // "my-jwt-secret-key",
        process.env.JWT_KEY,
        { expiresIn: "15m" }
      );

      // Store token in an HTTP-only cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true, // Prevent access from JavaScript
        secure: true, // Use secure cookies in production
        maxAge: 15 * 60 * 1000, // 15 mins
        sameSite: 'None', // Use 'None' in production, 'Lax' in development
      });

      console.log(accessToken)

      return res.status(201).json({ currentUser: user });
    } else {
      // throw new BadRequestError("Email already exists");
      return res.status(400).json({
        errors: [
          {
            message: "Email already exists",
          },
        ],
      });
    }
  }
);

// POST /api/users/signin
router.post("/signin", async (req, res, next) => {
  const { email, password } = req.body;

  // Authenticate user with email and password
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(400).json({ errors: [{ message: "User not found" }] });
  }
  console.log({ user });
  const isPasswordValid = await bcrypt.compare(password, user.password); // But here we will get user.password
  if (!isPasswordValid) {
    return res.status(400).json({ errors: [{ message: "Invalid password" }] });
  }
  // Generate JWT token
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    // "my-jwt-secret-key",
    process.env.JWT_KEY,
    { expiresIn: "15m" }
  );

  // req.session.jwt = token;
  // Store token in an HTTP-only cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true, // Prevent access from JavaScript
    maxAge: 15 * 60 * 1000, // 15 mins
    secure: true,
    sameSite: 'None', // Use 'None' in production, 'Lax' in development
  });
  return res.status(200).json({ currentUser: user });
});

// POST /api/users/signout
router.post("/signout", (req, res, next) => {
  try {
    res.clearCookie("accessToken");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ message: "Server error" }] });
  }
});

module.exports = router;
