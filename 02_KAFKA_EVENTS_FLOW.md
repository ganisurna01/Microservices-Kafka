# Kafka – Events & Message Flow

This document explains how Kafka is used to connect microservices. Each service publishes and consumes events via topics.

---

## Kafka Topics

| Topic       | Event Types                                                                 | Publisher(s)  | Consumer(s) |
|------------|------------------------------------------------------------------------------|---------------|-------------|
| `tickets`  | ticket.created, ticket.updated                                               | Tickets       | Orders      |
| `orders`   | order.created, order.cancelled, order.pending, order.failed                  | Orders        | Tickets, Payments, Expiration |
| `payments` | payment.created, payment.succeeded, payment.failed                           | Payments      | Orders      |
| `expiration` | expiration.expired                                                         | Expiration    | Orders      |

---

## Consumer Groups

| Service    | Topic      | Consumer Group      |
|------------|------------|---------------------|
| Orders     | tickets    | orders-tickets      |
| Orders     | payments   | orders-payments     |
| Orders     | expiration | orders-expiration   |
| Tickets    | orders     | tickets-orders      |
| Payments   | orders     | payments-orders     |
| Expiration | orders     | expiration-orders   |

---

## Message Format

All messages use JSON with an event type field:

```json
{ "type": "order.created", "id": "...", "userId": "...", "ticketId": "...", ... }
```

---

## Event Flow (same as RabbitMQ flow)

### 1. User Orders a Ticket
Orders → `orders` topic (order.created) → Tickets, Payments, Expiration consume

### 2. User Pays
Payments → `payments` topic (payment.created, payment.succeeded/failed) → Orders consumes

### 3. Order Expires (2 minutes)
Expiration service uses `setTimeout` to publish `expiration.expired` after delay → Orders consumes

---

## Environment

Set `KAFKA_BROKERS` (comma-separated for multiple brokers):
- Local: `KAFKA_BROKERS=localhost:9092`
- K8s: `KAFKA_BROKERS=kafka-srv:9092`

---

## Local Development

1. Start Kafka: `docker-compose up -d`
2. Set `KAFKA_BROKERS=localhost:9092` in each service's `.env` or environment
3. Run services (orders, tickets, payments, expiration)
