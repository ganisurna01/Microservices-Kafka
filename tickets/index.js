const express = require("express");
const ticketRoutes = require("./routes/ticket-routes");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { currentUser, requireAuth } = require("@ganeshsurnaticketingapp/common");
const { ordersConsumer } = require("./events/orders-consumer");
const kafkaInstance = require("./utils/kafkaInstance");

const app = express();
app.use(express.json());

app.use(cors()); // Will also work
// app.use(
//   cors({
//     origin: ["http://localhost:3000", "https://ticketing.dev", "http://ingress-nginx-controller.ingress-nginx.svc.cluster.local"], // Allowed origins
//     credentials: true, // Allow credentials (cookies)
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
//   })
// );

app.set("trust proxy", true); // To allow traffic coming from Ingress-Nginx
app.use(cookieParser());

app.use(currentUser);

app.use("/api/tickets", ticketRoutes);

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
      // "mongodb://tickets-mongo-srv:27017/tickets" // tickets will be db name ||| tickets-mongo-srv ==> see in tickets-mongo-depl.yaml
      process.env.MONGODB_URI // Set in tickets-depl.yaml ==> env ==> mongodb://tickets-mongo-srv:27017/tickets
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

const connectKafka = async () => {
  try {
    if (!process.env.KAFKA_BROKERS) {
      throw new Error("KAFKA_BROKERS is not defined.");
    }

    await kafkaInstance.connect(process.env.KAFKA_BROKERS);
  } catch (error) {
    console.error("Error connecting to Kafka:", error);
    process.exit(1);
  }
};

const consumeEvents = async () => {
  const kafka = kafkaInstance.kafka;
  const consumer = kafka.consumer({ groupId: "tickets-orders" });
  await consumer.connect();
  await consumer.subscribe({ topic: "orders", fromBeginning: true });
  ordersConsumer(consumer);
  console.log("Tickets service consumer started");
};

app.listen(3000, async () => {
  await connectKafka();
  await consumeEvents();
  await connectMongo();

  console.log("Tickets Service is running on port 3000");
});

const shutdown = async () => {
  await kafkaInstance.disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
