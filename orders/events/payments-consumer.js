const Order = require("../models/order");
const {
  orderPendingPublisher,
  orderFailedPublisher,
} = require("./order-publishers");

async function paymentsConsumer(consumer) {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const parsed = JSON.parse(message.value.toString());
        const type = parsed.type;

        console.log(`Received [${topic}] ${type}:`, parsed);

        if (type === "payment.created") {
          const order = await Order.findById(parsed.orderId);
          if (!order) {
            console.error("Order not found");
            return;
          }
          order.status = "pending_payment";
          await order.save();

          await orderPendingPublisher({
            orderId: order.id,
            status: order.status,
            ticketId: order.ticketId,
            version: order.version,
          });
          console.log("Order status set to pending_payment");
        }
        if (type === "payment.succeeded") {
          const order = await Order.findById(parsed.orderId);
          if (!order) {
            console.error("Order not found");
            return;
          }
          order.status = "completed";
          await order.save();
          console.log("Order status changed to completed");
        }
        if (type === "payment.failed") {
          const order = await Order.findById(parsed.orderId);
          if (!order) {
            console.error("Order not found");
            return;
          }
          order.status = "failed";
          await order.save();

          await orderFailedPublisher({
            id: order.id,
            ticketId: order.ticketId,
            userId: order.userId,
            status: order.status,
            version: order.version,
          });
          console.log("Order status set to failed");
        }
      } catch (error) {
        console.error("Error processing payment message:", error);
      }
    },
  });
}

module.exports = { paymentsConsumer };
