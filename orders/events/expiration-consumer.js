const Order = require("../models/order");
const { orderCancelledPublisher } = require("./order-publishers");

async function expirationConsumer(consumer) {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const parsed = JSON.parse(message.value.toString());
        const type = parsed.type;

        console.log(`Received [${topic}] ${type}:`, parsed);

        if (type === "expiration.expired") {
          const order = await Order.findById(parsed.orderId);
          if (!order) {
            console.error("Order not found");
            return;
          }
          if (order.status === "completed") {
            return;
          }
          order.set({ status: "cancelled" });
          await order.save();

          await orderCancelledPublisher({
            id: order.id,
            ticketId: order.ticketId,
            userId: order.userId,
            status: order.status,
            version: order.version,
          });
          console.log("Order cancelled due to expiration");
        }
      } catch (error) {
        console.error("Error processing expiration message:", error);
      }
    },
  });
}

module.exports = { expirationConsumer };
