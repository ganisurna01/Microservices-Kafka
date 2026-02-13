const { Kafka } = require("kafkajs");

class KafkaWrapper {
  constructor() {
    this._kafka = null;
    this._producer = null;
  }

  async connect(brokers) {
    try {
      this._kafka = new Kafka({
        clientId: "expiration-service",
        brokers: brokers.split(",").map((b) => b.trim()),
      });
      this._producer = this._kafka.producer();
      await this._producer.connect();
      console.log(`Connected to Kafka at ${brokers}`);
    } catch (err) {
      console.error("Failed to connect to Kafka:", err.message);
      throw err;
    }
  }

  get kafka() {
    if (!this._kafka) {
      throw new Error("Cannot access Kafka before connecting");
    }
    return this._kafka;
  }

  get producer() {
    if (!this._producer) {
      throw new Error("Cannot access Kafka producer before connecting");
    }
    return this._producer;
  }

  async disconnect() {
    if (this._producer) {
      await this._producer.disconnect();
      console.log("Kafka producer disconnected");
    }
  }
}

const kafkaInstance = new KafkaWrapper();
module.exports = kafkaInstance;
