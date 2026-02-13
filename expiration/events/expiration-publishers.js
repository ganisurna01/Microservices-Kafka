const kafkaInstance = require("../utils/kafkaInstance");

const EXPIRATION_TOPIC = "expiration";

async function orderExpiredPublisher(data) {
  try {
    // Kafka doesn't support delayed messages. The expiration service schedules
    // this call via setTimeout after the delay, so we just publish when called.
    const producer = kafkaInstance.producer;
    await producer.send({
      topic: EXPIRATION_TOPIC,
      messages: [
        {
          key: data.orderId,
          value: JSON.stringify({ type: "expiration.expired", orderId: data.orderId }),
        },
      ],
    });
    console.log(`Expiration expired event published for order ${data.orderId}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

module.exports = { orderExpiredPublisher };
