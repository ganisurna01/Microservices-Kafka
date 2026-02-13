const Ticket = require("../models/ticket");
const { ticketUpdatedPublisher } = require("./ticket-publishers");

async function ordersConsumer(consumer) {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const parsed = JSON.parse(message.value.toString());
        const type = parsed.type;

        console.log(`Received [${topic}] ${type}:`, parsed);

        if (type === "order.created") {
          const ticket = await Ticket.findById(parsed.ticketId);
          if (!ticket) {
            console.error("Ticket not found");
            return;
          }
          ticket.set({ orderId: parsed.id });
          await ticket.save();

          await ticketUpdatedPublisher({
            id: ticket.id,
            title: ticket.title,
            price: ticket.price,
            version: ticket.version,
          });
          console.log("Ticket reserved for order");
        }
        if (type === "order.cancelled") {
          const ticket = await Ticket.findOne({
            _id: parsed.ticketId,
            orderId: parsed.id,
          });
          if (!ticket) {
            console.error("Ticket not found, or Order ID mismatch");
            return;
          }
          ticket.set({ orderId: null });
          await ticket.save();

          await ticketUpdatedPublisher({
            id: ticket.id,
            title: ticket.title,
            price: ticket.price,
            version: ticket.version,
          });
          console.log("Ticket released");
        }
      } catch (error) {
        console.error("Error processing order message:", error);
      }
    },
  });
}

module.exports = { ordersConsumer };
