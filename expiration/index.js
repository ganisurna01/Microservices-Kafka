const express = require("express");
const { ordersConsumer } = require("./events/orders-consumer");
const kafkaInstance = require("./utils/kafkaInstance");

const app = express();
app.use(express.json());

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
  const consumer = kafka.consumer({ groupId: "expiration-orders" });
  await consumer.connect();
  await consumer.subscribe({ topic: "orders", fromBeginning: true });
  ordersConsumer(consumer);
  console.log("Expiration service consumer started");
};

app.listen(3000, async () => {
  await connectKafka();
  await consumeEvents();

  console.log("Expiration Service is running on port 3000");
});

const shutdown = async () => {
  await kafkaInstance.disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
