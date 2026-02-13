const kafkaInstance = require("../utils/kafkaInstance");

const TICKETS_TOPIC = "tickets";

async function publishTicketEvent(eventType, data) {
  try {
    const producer = kafkaInstance.producer;
    await producer.send({
      topic: TICKETS_TOPIC,
      messages: [
        {
          key: data.id,
          value: JSON.stringify({ type: eventType, ...data }),
        },
      ],
    });
    console.log(`${eventType} event published successfully`);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function ticketCreatedPublisher(data) {
  await publishTicketEvent("ticket.created", data);
}

async function ticketUpdatedPublisher(data) {
  await publishTicketEvent("ticket.updated", data);
}

module.exports = { ticketCreatedPublisher, ticketUpdatedPublisher };
