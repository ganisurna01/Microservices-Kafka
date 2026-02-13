# Ticketing App – Microservices Overview

This document explains how all services work together. Read this first to get the big picture.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Next.js)                                     │
│                    https://ticketing.dev  (Browser)                               │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │ HTTP + Cookies (JWT)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    INGRESS (Path-based routing)                                   │
│  /api/users → Auth  │  /api/tickets → Tickets  │  /api/orders → Orders           │
│  /api/payments → Payments  │  /* → Client (Next.js)                              │
└──┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────────┘
   │              │              │              │              │
   ▼              ▼              ▼              ▼              │
┌──────┐    ┌──────────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐
│ AUTH │    │ TICKETS  │   │ ORDERS  │   │ PAYMENTS │   │EXPIRATION│
│      │    │          │   │         │   │          │   │          │
│MongoDB│   │ MongoDB  │   │ MongoDB │   │ MongoDB  │   │  (no DB) │
└──────┘    └────┬─────┘   └────┬────┘   └────┬─────┘   └────┬─────┘
                 │              │              │              │
                 └──────────────┴──────────────┴──────────────┘
                                    │
                                    ▼
                        ┌─────────────────────┐
                        │       KAFKA         │
                        │  (Message Broker)   │
                        └─────────────────────┘
```

---

## Services Summary

| Service     | Port | Database | Purpose |
|------------|------|----------|---------|
| **Auth**   | 3000 | MongoDB  | Signup, Signin, Signout, CurrentUser. JWT in HTTP-only cookie. |
| **Tickets**| 3000 | MongoDB  | CRUD tickets. Owns ticket data. Reserves/releases tickets for orders. |
| **Orders** | 3000 | MongoDB  | Create order, list orders, cancel order. Owns order lifecycle. |
| **Payments**| 3000| MongoDB  | Stripe payment. Keeps local copy of orders. Publishes payment events. |
| **Expiration** | 3000 | None | Schedules order expiry after creation. Publishes delayed events. |
| **Client** | 3000 | None     | Next.js frontend. Calls APIs via `ticketing.dev`. |

---

## High-Level User Flows

### 1. Auth Flow (No Kafka)
- User signs up / signs in via **Auth** service.
- Auth returns JWT in HTTP-only cookie.
- **currentUser** and **requireAuth** (from `@ganeshsurnaticketingapp/common`) are used by Tickets, Orders, Payments.

### 2. Create Ticket
- Client → **Tickets** API → Ticket created in Tickets DB.
- **Tickets** publishes `ticket.created` → **Orders** consumes and stores a local copy of the ticket.

### 3. Order Ticket (Core Flow)
1. User clicks "Order Ticket" → Client → **Orders** API.
2. **Orders** creates order, publishes `order.created`.
3. **Tickets** consumes `order.created` → reserves ticket (sets `orderId` on ticket) → publishes `ticket.updated`. Because `ticket.updated` is published, **Orders** then consumes it and updates its local copy of the ticket.
4. **Payments** consumes `order.created` → stores order copy (userId, status, price).
5. **Expiration** consumes `order.created` → schedules `expiration.expired` for 2 minutes later.
6. Client redirects to Checkout.

### 4. Payment Flow
1. User pays → Client → **Payments** API (creates Stripe PaymentIntent).
2. **Payments** publishes `payment.created`.
3. **Orders** consumes `payment.created` → sets order to `pending_payment` → publishes `order.pending`.
4. **Payments** consumes `order.pending` → updates its order copy.
5. User completes payment on Stripe → Stripe webhook → **Payments** receives `payment_intent.succeeded` / `payment_intent.failed`.
6. **Payments** publishes `payment.succeeded` or `payment.failed`.
7. **Orders** consumes → sets order to `completed` or `failed`.

### 5. Order Expiration
1. After 2 minutes, **Expiration** publishes `expiration.expired` (scheduled via setTimeout).
2. **Orders** consumes → cancels order if not completed → publishes `order.cancelled`.
3. **Tickets** consumes `order.cancelled` → releases ticket (clears `orderId`).
4. **Payments** consumes `order.cancelled` → updates order status.

---

## Order Status Lifecycle

```
created → pending_payment → completed   (success path)
         ↘ failed                       (payment failed)
         ↘ cancelled                    (user cancelled or expired)
```

---

## Shared Package

All backend services (except Expiration) use `@ganeshsurnaticketingapp/common` for:
- **currentUser** – reads JWT from cookie, sets `req.currentUser`
- **requireAuth** – returns 401 if `req.currentUser` is null

---

## Quick Reference: Who Publishes / Consumes What

| Event               | Publisher   | Consumers                    |
|---------------------|------------|------------------------------|
| ticket.created      | Tickets    | Orders                       |
| ticket.updated      | Tickets    | Orders                       |
| order.created       | Orders     | Tickets, Payments, Expiration|
| order.cancelled     | Orders     | Tickets, Payments            |
| order.pending       | Orders     | Payments                     |
| order.failed        | Orders     | Payments                     |
| payment.created     | Payments   | Orders                       |
| payment.succeeded   | Payments   | Orders                       |
| payment.failed      | Payments   | Orders                       |
| expiration.expired  | Expiration | Orders                       |

See **KAFKA_EVENTS_FLOW.md** for topic names and consumer groups.
