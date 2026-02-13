// NOT USING THIS FILE, Using /events/ticket-publishers.js instead

class Publisher {
  constructor(channel) {
    this.channel = channel;
  }

  /**
   * Publishes to an exchange (similar to NATS subject)
   * @param {string} exchange - Exchange name
   * @param {string} routingKey - Routing key (optional)
   * @param {object} data - Message payload
   * @param {object} headers - Optional headers (for headers exchange)
   */
  async publish({
    exchange,
    exchangeType = "direct",
    routingKey = "",
    data,
    headers = {},
  }) {
    await this.channel.assertExchange(exchange, exchangeType, {
      durable: false,
      ...(exchangeType === "x-delayed-message" && {
        arguments: { "x-delayed-type": "direct" },
      }),
    });

    return new Promise((resolve, reject) => {
      try {
        if (!exchange) {
          console.error("Exchange name is required");
        }

        this.channel.publish(
          exchange,
          routingKey,
          Buffer.from(JSON.stringify(data)),
          { headers, persistent: true } // Make messages durable
        );
        console.log(`[Publisher] Sent to ${exchange}/${routingKey}`);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Publisher;
