const { orderExpiredPublisher } = require("./expiration-publishers");

// Kafka doesn't support delayed messages - use setTimeout to schedule expiration
async function scheduleOrderExpiration(orderId, delayInMilliSeconds) {
  if (delayInMilliSeconds > 0) {
    setTimeout(async () => {
      try {
        await orderExpiredPublisher({ orderId });
      } catch (err) {
        console.error("Failed to publish order expiration:", err);
      }
    }, delayInMilliSeconds);
    console.log(`Order ${orderId} will expire in ${delayInMilliSeconds} ms`);
  } else {
    await orderExpiredPublisher({ orderId });
  }
}

async function ordersConsumer(consumer) {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const parsed = JSON.parse(message.value.toString());
        const type = parsed.type;
        const data = parsed;

        console.log(`Received [${topic}] ${type}:`, data);

        if (type === "order.created") {
          const delayInMilliSeconds =
            new Date(data.expiresAt).getTime() - new Date().getTime();
          console.log(`Order will expire in ${delayInMilliSeconds} ms`);

          await scheduleOrderExpiration(data.id, delayInMilliSeconds);
        }
      } catch (error) {
        console.error("Error processing order message:", error);
      }
    },
  });
}

module.exports = { ordersConsumer };
