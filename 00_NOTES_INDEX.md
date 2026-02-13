# Ticketing Microservices – Notes Index

Start here when you return to this project. These notes describe how the services work together.

---

## Documentation Files

| File | Purpose |
|------|---------|
| **MICROSERVICES_OVERVIEW.md** | Architecture, services, high-level flows. Read first. |
| **KAFKA_EVENTS_FLOW.md** | Topics, consumer groups, event payloads, flow diagrams. |
| **NOTES_KAFKA.md** | What Kafka is, why we use it, how it works, producer/consumer examples. |
| **CLIENT_AND_ROUTING.md** | Client API calls, Ingress routing, auth, checkout flow. |
| **common/README.md** | Code sharing via NPM package `@ganeshsurnaticketingapp/common`. |

---

## Services at a Glance

| Service | What it does |
|---------|--------------|
| **Auth** | Signup, signin, JWT cookie. No Kafka. |
| **Tickets** | Owns tickets. Publishes ticket.*. Consumes order.created, order.cancelled. |
| **Orders** | Owns orders. Publishes order.*. Consumes ticket.*, payment.*, expiration.expired. |
| **Payments** | Stripe. Publishes payment.*. Consumes order.*. |
| **Expiration** | Schedules order expiry. Consumes order.created. Publishes expiration.expired (delayed). |
| **Client** | Next.js frontend. Calls APIs via `ticketing.dev`. |

---

## Core Flow: Order → Pay → Complete

1. **Order** → Orders publishes `order.created` → Tickets reserves ticket and publishes `ticket.updated` → Orders updates its local ticket copy. Payments stores order. Expiration schedules 2‑min timer.
2. **Pay** → User hits Payments API → `payment.created` → Orders sets `pending_payment` → `order.pending` → Payments updates.
3. **Complete** → Stripe webhook → `payment.succeeded` → Orders sets `completed`.
4. **Expire** → After 2 min → `expiration.expired` → Orders cancels → `order.cancelled` → Tickets releases ticket.

---

## Data Flow Between Services

```
Tickets (owner)  ──ticket.*──►  Orders (copy)
Orders (owner)   ──order.*──►   Tickets, Payments, Expiration
Payments         ──payment.*──► Orders
Expiration       ──expiration.expired──► Orders
```

---

## Key Files by Service

| Service | Entry | Routes | Events |
|---------|-------|--------|--------|
| Auth | auth/index.js | auth/routes/auth-routes.js | — |
| Tickets | tickets/index.js | tickets/routes/ticket-routes.js | ticket-publishers.js, orders-consumer.js |
| Orders | orders/index.js | orders/routes/order-routes.js | order-publishers.js, tickets-consumer.js, payments-consumer.js, expiration-consumer.js |
| Payments | payments/index.js | payments/routes/payment-routes.js | payment-publishers.js, orders-consumer.js |
| Expiration | expiration/index.js | — | expiration-publishers.js, orders-consumer.js |

---

## Environment Variables (by service)

- **Auth, Tickets, Orders, Payments:** `JWT_KEY`, `MONGODB_URI`
- **Tickets, Orders, Payments, Expiration:** `KAFKA_BROKERS`
- **Payments:** Stripe keys, webhook secret
- **Client:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
