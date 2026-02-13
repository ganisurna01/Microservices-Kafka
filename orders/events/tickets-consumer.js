const Ticket = require("../models/ticket");

async function ticketsConsumer(consumer) {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const parsed = JSON.parse(message.value.toString());
        const type = parsed.type;

        console.log(`Received [${topic}] ${type}:`, parsed);

        if (type === "ticket.created") {
          const { id, title, price } = parsed;
          const ticket = new Ticket({ _id: id, title, price });
          await ticket.save();
          console.log("Ticket created in Orders DB");
        }
        if (type === "ticket.updated") {
          const { id, title, price, version } = parsed;
          const ticket = await Ticket.findOne({ _id: id, version: version - 1 });
          if (!ticket) {
            console.log("Ticket not found (version mismatch), skipping");
            return;
          }
          ticket.set({ title, price, version });
          await ticket.save();
          console.log("Ticket updated in Orders DB");
        }
      } catch (error) {
        console.error("Error processing ticket message:", error);
      }
    },
  });
}

module.exports = { ticketsConsumer };
