const kafkaInstance = require("../utils/kafkaInstance");

const ORDERS_TOPIC = "orders";

async function publishOrderEvent(eventType, data) {
  try {
    const producer = kafkaInstance.producer;
    await producer.send({
      topic: ORDERS_TOPIC,
      messages: [
        {
          key: data.id || data.orderId,
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

async function orderCreatedPublisher(data) {
  await publishOrderEvent("order.created", data);
}

async function orderCancelledPublisher(data) {
  await publishOrderEvent("order.cancelled", data);
}

async function orderFailedPublisher(data) {
  await publishOrderEvent("order.failed", data);
}

async function orderPendingPublisher(data) {
  await publishOrderEvent("order.pending", data);
}

module.exports = {
  orderCreatedPublisher,
  orderCancelledPublisher,
  orderFailedPublisher,
  orderPendingPublisher,
};
