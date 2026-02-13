const express = require("express");
const authRoutes = require("./routes/auth-routes");
const mongoose = require("mongoose");
const cors = require("cors");
// const cookieSession = require('cookie-session')
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());

// app.use(cors()) // Will also work
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ticketing.dev",
      "http://ingress-nginx-controller.ingress-nginx.svc.cluster.local",
    ], // Allowed origins
    credentials: true, // Allow credentials (cookies)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

app.set("trust proxy", true); // To allow traffic coming from Ingress-Nginx
app.use(cookieParser());

// // Cookie Session Middleware
// app.use(
//   cookieSession({
//     signed: false,
//     name: "session", // Explicitly set the cookie name
//     secure: true,
//   })
// );

app.use("/api/users", authRoutes);

// Connect to mongoose server
const connectMongo = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY is not defined.");
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined.");
  }

  try {
    await mongoose.connect(
      // "mongodb://auth-mongo-srv:27017/auth" // auth will be db name ||| auth-mongo-srv ==> see in auth-mongo-depl.yaml
      process.env.MONGODB_URI // Set in auth-depl.yaml ==> env ==> mongodb://auth-mongo-srv:27017/auth
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

app.listen(3000, async () => {
  await connectMongo();

  console.log("Auth Service is running on port 3000");
});
