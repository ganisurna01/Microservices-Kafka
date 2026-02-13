# Kafka – What, Why, How & Examples

A practical guide to Apache Kafka with examples from this Ticketing app.

---

## Table of Contents

1. [What is Kafka?](#what-is-kafka)
2. [Why Kafka?](#why-kafka)
3. [How Kafka Works](#how-kafka-works)
4. [Core Concepts](#core-concepts)
5. [Kafka Operations with Examples](#kafka-operations-with-examples)
6. [Flow in This App](#flow-in-this-app)

---

## What is Kafka?

**Apache Kafka** is a distributed **event streaming platform** used to publish, store, and consume streams of records in real time.

- **Producer** – publishes messages to topics
- **Consumer** – subscribes to topics and processes messages
- **Broker** – Kafka server that stores and serves messages
- **Topic** – a named stream of messages (like a category or channel)

Think of it as a high-throughput, durable message queue where services can send and receive events asynchronously without talking directly to each other.

---

## Why Kafka?

| Benefit | Explanation |
|---------|-------------|
| **Decoupling** | Services don’t call each other directly; they publish/consume events |
| **Reliability** | Messages are persisted and replicated; can replay from offset |
| **Scalability** | Topics are partitioned; consumers can run in parallel |
| **Ordering** | Within a partition, messages stay ordered by key |
| **Durable** | Messages stay on disk; consumers read at their own pace |
| **High throughput** | Built for large-scale, real-time event streaming |

### Why Kafka in This App?

- Orders, Tickets, Payments, and Expiration services communicate via events.
- Each service publishes events when something happens (e.g. order created, payment succeeded).
- Other services consume those events and update their own data.
- Kafka enables this event-driven flow without tight coupling between services.

---

## How Kafka Works

```
┌─────────────┐                    ┌──────────────────────────────────────────┐
│  Producer   │ ──── publish ────► │              KAFKA BROKER                │
│  (Orders)   │                    │  ┌─────────────┐  ┌─────────────┐        │
└─────────────┘                    │  │   Topic:    │  │   Topic:    │        │
                                   │  │   orders    │  │   tickets   │  ...   │
┌─────────────┐                    │  │  partition0 │  │  partition0 │        │
│  Consumer   │ ◄──── consume ──── │  │  partition1 │  │  partition1 │        │
│  (Tickets)  │                    │  └─────────────┘  └─────────────┘        │
└─────────────┘                    └──────────────────────────────────────────┘
```

1. Producer sends messages to a topic (optionally with a key).
2. Kafka stores messages in partitions and keeps them ordered by key.
3. Consumer subscribes to one or more topics with a consumer group.
4. Consumer group coordinates which consumer reads which partition.

---

## Core Concepts

### Topic

A named stream of messages. In this app:

| Topic       | Purpose                                   |
|------------|-------------------------------------------|
| `tickets`  | Ticket lifecycle events                   |
| `orders`   | Order lifecycle events                    |
| `payments` | Payment events                            |
| `expiration` | Order expiration events                 |

### Partition

- A topic is split into one or more partitions.
- Messages with the same key go to the same partition.
- Within a partition, order is guaranteed.
- Example: order ID as key → all events for that order in one partition → ordered.

### Consumer Group

- Several consumers share work via a group ID.
- Each partition is read by only one consumer in the group.
- Different groups can consume the same topic independently.
- Example: `orders-tickets` reads from `tickets`; `tickets-orders` reads from `orders`.

### Offset

- Position of a message within a partition.
- Consumers track offsets per partition.
- Kafka can replay from a given offset.

### Message Structure

```
Message = {
  key:   "order-123"           // optional, used for partitioning
  value: '{"type":"order.created","id":"...","userId":"..."}'  // JSON string
}
```

---

## Kafka Operations with Examples

### 1. Kafka Client Setup (Connection)

**File:** `orders/utils/kafkaInstance.js`

```javascript
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "orders-service",    // identifies this app to Kafka
  brokers: ["localhost:9092"],   // Kafka broker addresses
});

// Create a producer for publishing
const producer = kafka.producer();
await producer.connect();
```

**What it does:** Connects to Kafka and creates a producer instance for sending messages.

---

### 2. Producer – Publish Messages

**File:** `orders/events/order-publishers.js`

```javascript
async function publishOrderEvent(eventType, data) {
  const producer = kafkaInstance.producer;
  
  await producer.send({
    topic: "orders",
    messages: [
      {
        key: data.id || data.orderId,   // same key → same partition → ordering
        value: JSON.stringify({ type: eventType, ...data }),
      },
    ],
  });
}

// Example: publish when order is created
await orderCreatedPublisher({
  id: order.id,
  userId: order.userId,
  ticketId: order.ticketId,
  price: order.price,
  status: "created",
  expiresAt: order.expiresAt,
  version: order.version,
});
```

**Producer operations:**

| Operation   | Code                                  | Purpose                    |
|------------|----------------------------------------|----------------------------|
| Send one   | `producer.send({ topic, messages })`   | Publish to a topic         |
| Send many  | `messages: [msg1, msg2, msg3]`         | Batch publish              |
| With key   | `key: "order-123"`                     | Partitioning and ordering  |
| Disconnect | `producer.disconnect()`                | Clean shutdown             |

---

### 3. Consumer – Subscribe and Process Messages

**File:** `orders/index.js` – Consumer setup

```javascript
const kafka = kafkaInstance.kafka;

// Create consumer with a group ID
const consumer = kafka.consumer({ groupId: "orders-tickets" });
await consumer.connect();

// Subscribe to topic(s)
await consumer.subscribe({
  topic: "tickets",
  fromBeginning: true,   // read from start if no offset stored
});

// Start consuming
consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    // process...
  },
});
```

**File:** `orders/events/tickets-consumer.js` – Message handling

```javascript
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const parsed = JSON.parse(message.value.toString());
    const type = parsed.type;

    if (type === "ticket.created") {
      const ticket = new Ticket({ _id: parsed.id, title: parsed.title, price: parsed.price });
      await ticket.save();
    }
    if (type === "ticket.updated") {
      const ticket = await Ticket.findOne({ _id: parsed.id, version: parsed.version - 1 });
      ticket.set({ title: parsed.title, price: parsed.price, version: parsed.version });
      await ticket.save();
    }
  },
});
```

**Consumer operations:**

| Operation       | Code                              | Purpose                         |
|----------------|------------------------------------|---------------------------------|
| Create         | `kafka.consumer({ groupId })`      | Create consumer in a group      |
| Connect        | `consumer.connect()`               | Join the broker                 |
| Subscribe      | `consumer.subscribe({ topic })`    | Listen to topic(s)              |
| Run            | `consumer.run({ eachMessage })`    | Start processing messages       |
| fromBeginning  | `fromBeginning: true`              | Read from oldest if no offset   |

---

### 4. Consumer Group Example

Multiple services consume from the same topic, each with its own group:

```javascript
// Tickets service – consumes orders
const consumer = kafka.consumer({ groupId: "tickets-orders" });
await consumer.subscribe({ topic: "orders" });

// Payments service – consumes orders
const consumer = kafka.consumer({ groupId: "payments-orders" });
await consumer.subscribe({ topic: "orders" });

// Expiration service – consumes orders
const consumer = kafka.consumer({ groupId: "expiration-orders" });
await consumer.subscribe({ topic: "orders" });
```

Same `orders` topic, different groups → each service gets its own copy of all messages.

**Use:** When one event must trigger actions in multiple services. Here, `order.created` must reach Tickets (reserve), Payments (store), and Expiration (schedule) independently. Each group has its own offset, so services can consume at different speeds and replay without affecting others. Without separate groups, only one consumer would get each message.

---

### 5. One Service, Multiple Consumers

Orders service consumes from several topics:

```javascript
// orders/index.js
const ticketsConsumerInstance = kafka.consumer({ groupId: "orders-tickets" });
await ticketsConsumerInstance.subscribe({ topic: "tickets" });
ticketsConsumer(ticketsConsumerInstance);

const paymentsConsumerInstance = kafka.consumer({ groupId: "orders-payments" });
await paymentsConsumerInstance.subscribe({ topic: "payments" });
paymentsConsumer(paymentsConsumerInstance);

const expirationConsumerInstance = kafka.consumer({ groupId: "orders-expiration" });
await expirationConsumerInstance.subscribe({ topic: "expiration" });
expirationConsumer(expirationConsumerInstance);
```

Each consumer has its own group ID and topic.

---

### 6. Message Structure Used in This App

**Publisher (Orders):**

```javascript
{
  type: "order.created",   // event type
  id: "abc123",
  userId: "user456",
  ticketId: "ticket789",
  price: 299,
  status: "created",
  expiresAt: "2025-02-13T12:00:00Z",
  version: 1
}
```

**Consumer:**

```javascript
const parsed = JSON.parse(message.value.toString());
if (parsed.type === "order.created") {
  // handle order.created
}
```

---

### 7. Graceful Shutdown

**File:** `orders/index.js`

```javascript
const shutdown = async () => {
  await kafkaInstance.disconnect();  // disconnects producer
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
```

---

## Flow in This App

### End-to-End Example: User Orders a Ticket

```
1. Client POST /api/orders
   └─► Orders creates order in DB
   └─► Orders PRODUCES to topic "orders": { type: "order.created", id, userId, ticketId, ... }

2. Kafka delivers to 3 consumer groups:
   ├─► tickets-orders (Tickets)  → reserves ticket → PRODUCES to "tickets": ticket.updated
   ├─► payments-orders (Payments) → stores order copy
   └─► expiration-orders (Expiration) → schedules setTimeout(2min) → later PRODUCES to "expiration": expiration.expired

3. orders-tickets (Orders) consumes ticket.updated
   └─► Updates local ticket copy in Orders DB

4. (2 min later) orders-expiration (Orders) consumes expiration.expired
   └─► Cancels order if not paid → PRODUCES order.cancelled
   └─► tickets-orders consumes → releases ticket
```

---

## Quick Reference

| Component   | Location                     | Role                          |
|------------|------------------------------|-------------------------------|
| Kafka setup| `*/utils/kafkaInstance.js`   | Connect, producer, disconnect |
| Producers  | `*/events/*-publishers.js`   | Send events to topics         |
| Consumers  | `*/events/*-consumer.js`     | Process messages from topics  |
| Startup    | `*/index.js`                 | Connect, subscribe, run       |

---

## Environment

```bash
# Local
KAFKA_BROKERS=localhost:9092

# Kubernetes
KAFKA_BROKERS=kafka-srv:9092
```

Start Kafka locally: `docker-compose up -d`
