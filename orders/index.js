const express = require("express");
const orderRoutes = require("./routes/order-routes");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { currentUser, requireAuth } = require("@ganeshsurnaticketingapp/common");
const { expirationConsumer } = require("./events/expiration-consumer");
const { paymentsConsumer } = require("./events/payments-consumer");
const kafkaInstance = require("./utils/kafkaInstance");
const { ticketsConsumer } = require("./events/tickets-consumer");

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

app.use("/api/orders", orderRoutes);

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
      /* "mongodb://tickets-mongo-srv:27017/tickets" 
       tickets will be db name ||| tickets-mongo-srv ==> see in tickets-mongo-depl.yaml
      */
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

  const ticketsConsumerInstance = kafka.consumer({ groupId: "orders-tickets" });
  await ticketsConsumerInstance.connect();
  await ticketsConsumerInstance.subscribe({ topic: "tickets", fromBeginning: true });
  ticketsConsumer(ticketsConsumerInstance);

  const paymentsConsumerInstance = kafka.consumer({ groupId: "orders-payments" });
  await paymentsConsumerInstance.connect();
  await paymentsConsumerInstance.subscribe({ topic: "payments", fromBeginning: true });
  paymentsConsumer(paymentsConsumerInstance);

  const expirationConsumerInstance = kafka.consumer({ groupId: "orders-expiration" });
  await expirationConsumerInstance.connect();
  await expirationConsumerInstance.subscribe({ topic: "expiration", fromBeginning: true });
  expirationConsumer(expirationConsumerInstance);

  console.log("Orders service consumers started");
};

app.listen(3000, async () => {
  await connectKafka();
  await consumeEvents();
  await connectMongo();

  console.log("Orders Service is running on port 3000");
});

const shutdown = async () => {
  await kafkaInstance.disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
