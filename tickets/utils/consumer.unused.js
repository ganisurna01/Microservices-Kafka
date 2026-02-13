// NOT USING THIS FILE, Using /events/tickets-consumer.js instead


class Consumer {
    constructor(channel) {
      this.channel = channel;
    }
  
    /**
     * Starts consuming messages
     * @param {string} queue - Queue name (equivalent to NATS queue group)
     * @param {string} exchange - Exchange to bind to (optional)
     * @param {string} routingKey - Binding key (optional)
     * @param {function} onMessage - Handler function (data, msg)
     */
    async listen({queue, exchange = '', exchangeType='direct', routingKey = '', onMessage}) {
      // Assert queue (equivalent to durable subscription)
      await this.channel.assertQueue(queue, {
        durable: true,
      });
  
      // Bind to exchange if provided
      if (exchange) {
        await this.channel.assertExchange(exchange, exchangeType, { durable: false });
        await this.channel.bindQueue(queue, exchange, routingKey);
      }
  
      console.log(`[Consumer] Waiting for messages in ${queue}...`);
  
      this.channel.consume(queue, async (msg) => {
        if (!msg) return;
  
        try {
          const data = this.parseMessage(msg);
          await onMessage(data, msg);
          this.channel.ack(msg); // Manual acknowledgement
        } catch (err) {
          console.error(`[Consumer] Error processing message:`, err);
          this.channel.nack(msg, false, false); // Reject message
        }
      }, {
        noAck: false // Manual acknowledgement mode
      });
    }
  
    parseMessage(msg) {
      return JSON.parse(msg.content.toString());
    }
  }
  
  module.exports = Consumer;