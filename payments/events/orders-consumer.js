const Order = require("../models/order");

async function ordersConsumer(consumer) {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const parsed = JSON.parse(message.value.toString());
        const type = parsed.type;

        console.log(`Received [${topic}] ${type}:`, parsed);

        if (type === "order.created") {
          const order = new Order({
            _id: parsed.id,
            status: parsed.status,
            userId: parsed.userId,
            price: parsed.price,
          });
          await order.save();
          console.log("Order created in Payments DB");
        }
        if (type === "order.cancelled") {
          const order = await Order.findOne({
            _id: parsed.id,
            version: parsed.version - 1,
          });
          if (!order) {
            console.error("Order not found");
            return;
          }
          order.set({ status: parsed.status || "cancelled" });
          await order.save();
          console.log("Order cancelled in Payments DB");
        }
        if (type === "order.pending") {
          const order = await Order.findOne({
            _id: parsed.orderId,
            version: parsed.version - 1,
          });
          if (!order) {
            console.error("Order not found");
            return;
          }
          order.set({ status: parsed.status || "pending_payment" });
          await order.save();
          console.log("Order pending in Payments DB");
        }
        if (type === "order.failed") {
          const order = await Order.findOne({
            _id: parsed.id,
            version: parsed.version - 1,
          });
          if (!order) {
            console.error("Order not found");
            return;
          }
          order.set({ status: parsed.status || "failed" });
          await order.save();
          console.log("Order failed in Payments DB");
        }
      } catch (error) {
        console.error("Error processing order message:", error);
      }
    },
  });
}

module.exports = { ordersConsumer };
