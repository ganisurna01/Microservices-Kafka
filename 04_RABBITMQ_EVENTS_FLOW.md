# RabbitMQ – Events & Message Flow (DEPRECATED – see KAFKA_EVENTS_FLOW.md)

> **Note:** This app now uses Kafka instead of RabbitMQ. See `KAFKA_EVENTS_FLOW.md` for current event flow.

This document explains how RabbitMQ was used to connect microservices. Each service publishes and consumes events via exchanges and queues.

---

## RabbitMQ Concepts Used

| Concept     | Role |
|------------|------|
| **Exchange** | Receives messages and routes them to queues. |
| **Queue**    | Holds messages for a consumer. |
| **Binding**  | Connects queue to exchange using a routing key pattern. |
| **Routing key** | Used to filter which messages a queue receives (e.g. `order.*` = all order events). |

---

## Exchanges

| Exchange             | Type            | Description |
|----------------------|-----------------|-------------|
| `tickets_exchange`   | topic           | Ticket events (`ticket.created`, `ticket.updated`). |
| `orders_exchange`    | topic           | Order events (`order.created`, `order.cancelled`, etc.). |
| `payments_exchange`  | topic           | Payment events (`payment.created`, `payment.succeeded`, `payment.failed`). |
| `expiration_exchange`| x-delayed-message | Delayed order expiry (`expiration.expired`). Uses plugin. |

---

## Queues & Bindings

```
Exchange              Binding (routing key)    Queue                 Consumer
─────────────────────────────────────────────────────────────────────────────────
tickets_exchange      ticket.*                 orders_vs_tickets     Orders
orders_exchange       order.*                  tickets_vs_orders     Tickets
orders_exchange       order.*                  payments_vs_orders    Payments
orders_exchange       order.*                  expiration_vs_orders  Expiration
payments_exchange     payment.*                orders_vs_payments    Orders
expiration_exchange   expiration.expired       orders_vs_expiration  Orders
```

---

## Event Details

### 1. Ticket Events (tickets_exchange)

| Event            | Publisher | Payload |
|------------------|-----------|---------|
| ticket.created   | Tickets   | `{ id, title, price, userId, version }` |
| ticket.updated   | Tickets   | `{ id, title, price, userId, version }` (sometimes without userId) |

**Consumer: Orders** (`orders_vs_tickets`)
- `ticket.created` → Create local Ticket copy.
- `ticket.updated` → Update local Ticket (version-aware).

---

### 2. Order Events (orders_exchange)

| Event           | Publisher | Payload |
|-----------------|-----------|---------|
| order.created   | Orders    | `{ id, userId, ticketId, price, status, expiresAt, version }` |
| order.cancelled | Orders    | `{ id, ticketId, userId, status, expiresAt, version }` |
| order.pending   | Orders    | `{ orderId, status, ticketId, version }` |
| order.failed    | Orders    | `{ id, ticketId, userId, status, version }` |

**Consumers:**

| Queue                 | Service    | Handles |
|-----------------------|------------|---------|
| tickets_vs_orders     | Tickets    | `order.created` → Reserve ticket, set `orderId` on ticket, publish `ticket.updated` (so **Orders** consumes `ticket.updated` and updates its local ticket copy). `order.cancelled` → Release ticket, clear `orderId`, publish `ticket.updated`. |
| payments_vs_orders    | Payments   | `order.created` → Store order. `order.cancelled` → Update order. `order.pending` → Update status. `order.failed` → Update status. |
| expiration_vs_orders  | Expiration | `order.created` → Schedule delayed `expiration.expired`. |

---

### 3. Payment Events (payments_exchange)

| Event             | Publisher | Payload |
|-------------------|-----------|---------|
| payment.created   | Payments  | `{ id, orderId, paymentId }` |
| payment.succeeded | Payments  | `{ orderId, paymentId }` |
| payment.failed    | Payments  | `{ orderId, paymentId }` |

**Consumer: Orders** (`orders_vs_payments`)
- `payment.created` → Set order status to `pending_payment`, publish `order.pending`.
- `payment.succeeded` → Set order status to `completed`.
- `payment.failed` → Set order status to `failed`, publish `order.failed`.

---

### 4. Expiration Events (expiration_exchange)

| Event             | Publisher | Payload |
|-------------------|-----------|---------|
| expiration.expired| Expiration| `{ orderId }` (message delayed by `x-delay` header) |

**Consumer: Orders** (`orders_vs_expiration`)
- If order not `completed` → Set status to `cancelled`, publish `order.cancelled`.
- If already `completed` → Only ack (no changes).

---

## Complete Event Flow Diagrams

### Flow 1: User Orders a Ticket

```
Client                Orders              RabbitMQ              Tickets         Payments       Expiration
   │                     │                     │                    │               │               │
   │ POST /orders        │                     │                    │               │               │
   │────────────────────>│                     │                    │               │               │
   │                     │ order.created       │                    │               │               │
   │                     │────────────────────>│                    │               │               │
   │                     │                     │──tickets_vs_orders─>│               │               │
   │                     │                     │                    │ Reserve ticket│               │
   │                     │                     │                    │ ticket.updated│               │
   │                     │                     │<───────────────────│               │               │
   │                     │                     │──payments_vs_orders────────────────>│               │
   │                     │                     │                    │ Store order   │               │
   │                     │                     │──expiration_vs_orders───────────────>│               │
   │                     │                     │                    │               │ Schedule 2min │
   │ 201 { order }       │                     │                    │               │               │
   │<────────────────────│                     │                    │               │               │
```

### Flow 2: User Pays (Success Path)

```
Client                Payments             RabbitMQ              Orders
   │                     │                     │                    │
   │ POST /payments      │                     │                    │
   │────────────────────>│                     │                    │
   │                     │ payment.created     │                    │
   │                     │────────────────────>│                    │
   │                     │                     │──orders_vs_payments>│
   │                     │                     │                    │ status= pending_payment
   │                     │                     │                    │ order.pending
   │                     │                     │<───────────────────│
   │ clientSecret        │                     │                    │
   │<────────────────────│                     │                    │
   │                     │                     │                    │
   │ (Stripe redirect)   │ Stripe Webhook      │                    │
   │                     │ payment_intent.succeeded                 │
   │                     │ payment.succeeded   │                    │
   │                     │────────────────────>│                    │
   │                     │                     │──orders_vs_payments>│
   │                     │                     │                    │ status= completed
   │                     │                     │                    │
```

### Flow 3: Order Expires (2 Minutes)

```
Expiration           RabbitMQ              Orders              Tickets
   │                     │                    │                    │
   │ (2 min delay)       │                    │                    │
   │ expiration.expired  │                    │                    │
   │────────────────────>│                    │                    │
   │                     │──orders_vs_expiration>│                  │
   │                     │                    │ status= cancelled  │
   │                     │                    │ order.cancelled    │
   │                     │                    │───────────────────>│
   │                     │                    │                    │ Release ticket
   │                     │                    │                    │ (clear orderId)
```

---

## Version & Optimistic Locking

- Tickets and Orders use a `version` field and `mongoose-update-if-current`.
- On conflict, update fails and the message can be nack’d and retried.
- Ensures correct ordering when events may arrive out of order.

---

## Message Acknowledgement

- Manual ack: `channel.ack(data)` after successful handling.
- On error: `channel.nack(data, false, true)` to requeue.
- Ensures at-least-once delivery and retries on failures.

---

## RabbitMQ Connection (Per Service)

Each service uses a shared wrapper (e.g. `rabbitMQInstance.js`):

- Connects once at startup.
- Reuses the same channel for publish and consume.
- Handles SIGINT/SIGTERM with graceful connection close.

---

## Service → File Mapping

| Service    | Publisher File(s)                 | Consumer File(s)               |
|-----------|------------------------------------|--------------------------------|
| Tickets   | `ticket-publishers.js`            | `orders-consumer.js`           |
| Orders    | `order-publishers.js`             | `tickets-consumer.js`, `payments-consumer.js`, `expiration-consumer.js` |
| Payments  | `payment-publishers.js`           | `orders-consumer.js`           |
| Expiration| `expiration-publishers.js`        | `orders-consumer.js`           |
