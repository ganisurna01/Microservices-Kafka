# Client & Ingress Routing

This document explains how the Next.js client talks to backend services and how Ingress routes requests.

---

## Hosts & Base URLs

| Environment | Client (Browser) | Server-Side (Next.js) |
|-------------|------------------|------------------------|
| **Production / K8s** | `https://ticketing.dev` | `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local` |

- Browser: `credentials: "include"` so cookies are sent.
- Server components: Pass cookies manually via `Cookie` header.

---

## Ingress Path Routing

```
Path Pattern          →  Backend Service    →  Target Port
────────────────────────────────────────────────────────────
/api/users/*          →  auth-srv           →  3000
/api/tickets/*        →  tickets-srv        →  3000
/api/orders/*         →  orders-srv         →  3000
/api/payments/*       →  payments-srv       →  3000
/* (fallback)         →  client-srv         →  3000  (Next.js)
```

Ingress is configured for:
- `ticketing.dev` (browser)
- `ingress-nginx-controller.ingress-nginx.svc.cluster.local` (server-side)

---

## Client API Calls

### Auth

| Action     | Method | URL                  | Used In        |
|------------|--------|----------------------|----------------|
| Signup     | POST   | /api/users/signup    | RegisterForm   |
| Signin     | POST   | /api/users/signin    | LoginForm      |
| Signout    | POST   | /api/users/signout   | Header         |
| CurrentUser| GET    | /api/users/currentuser | CurrentUserContext |

### Tickets

| Action      | Method | URL                  | Used In        |
|-------------|--------|----------------------|----------------|
| List tickets| GET    | /api/tickets         | TicketsList    |
| Get ticket  | GET    | /api/tickets/:id     | TicketDetails  |
| Create      | POST   | /api/tickets         | TicketForm     |
| Update      | PUT    | /api/tickets/:id     | TicketForm     |

### Orders

| Action     | Method | URL                   | Used In        |
|------------|--------|------------------------|----------------|
| Create     | POST   | /api/orders            | TicketsList (Order Ticket) |
| List       | GET    | /api/orders            | OrdersList     |
| Get one    | GET    | /api/orders/:id        | Checkout page  |
| Cancel     | DELETE | /api/orders/:id        | (if implemented) |

### Payments

| Action     | Method | URL                   | Used In        |
|------------|--------|------------------------|----------------|
| Create intent | POST | /api/payments          | CheckoutForm   |

---

## Client Fetch Hooks

### useClientFetch (Browser)

- **File:** `client/hooks/useClientFetch.js`
- **Base URL:** `https://ticketing.dev`
- **Use:** Client components (TicketsList, etc.)
- **Credentials:** `credentials: "include"` (cookies sent automatically)

### useServerFetch (Server)

- **File:** `client/hooks/useServerFetch.js`
- **Base URL:** `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local`
- **Use:** Server components (TicketForm, etc.)
- **Credentials:** Passes `Cookie` header from `cookies()` (Next.js)

---

## Authentication Flow (Client → Backend)

1. User signs in → Auth sets `accessToken` cookie (HTTP-only).
2. All API calls include cookies via `credentials: "include"`.
3. Backend services use `currentUser` middleware to read JWT from cookie.
4. `req.currentUser` is set (e.g. `{ id, email }`) or null.
5. `requireAuth` returns 401 if no `currentUser`.

---

## User Flow Through the App

```
1. Landing → Register/Login (Auth)
2. Landing → Browse tickets (Tickets API)
3. Create ticket (Tickets API)
4. Order ticket → Orders API → Redirect to /checkout?orderId=xxx
5. Checkout page → Fetch order (Orders API) → Show Stripe form
6. CheckoutForm → POST /api/payments → Stripe redirect
7. Payment success → /payment-success
```

---

## Checkout Flow (Client Side)

1. **TicketsList** → User clicks "Order Ticket" → `POST https://ticketing.dev/api/orders` with `{ ticketId, version }`.
2. On success → `router.push(/checkout?orderId=...)`.
3. **Checkout page** (server) → Fetches order from `ingress.../api/orders/:id` with cookies.
4. **Checkout** component → Shows order, countdown, Stripe Elements.
5. **CheckoutForm** → On submit, `POST https://ticketing.dev/api/payments` with `{ amount, currency, orderId }` → gets `clientSecret`.
6. Stripe `confirmPayment` → Redirect to `return_url` (e.g. `/payment-success`).

---

## CORS

Auth service allows:
- `http://localhost:3000`
- `https://ticketing.dev`
- `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local`

Other services use `cors()` without custom config (all origins).

---

## Stripe Webhook

- **Endpoint:** `POST /api/payments/webhooks/stripe`
- **Source:** Stripe (not the browser)
- **Note:** Route uses `express.raw()` for webhook verification (JSON body is disabled for this path in payments service).
