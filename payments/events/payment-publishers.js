const kafkaInstance = require("../utils/kafkaInstance");

const PAYMENTS_TOPIC = "payments";

async function publishPaymentEvent(eventType, data) {
  try {
    const producer = kafkaInstance.producer;
    await producer.send({
      topic: PAYMENTS_TOPIC,
      messages: [
        {
          key: data.orderId,
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

async function paymentCreatedPublisher(data) {
  await publishPaymentEvent("payment.created", data);
}

async function paymentSucceededPublisher(data) {
  await publishPaymentEvent("payment.succeeded", data);
}

async function paymentFailedPublisher(data) {
  await publishPaymentEvent("payment.failed", data);
}

module.exports = {
  paymentCreatedPublisher,
  paymentSucceededPublisher,
  paymentFailedPublisher,
};
