const express = require("express");
const { currentUser, requireAuth } = require("@ganeshsurnaticketingapp/common");
const Order = require("../models/order");
const stripe = require("../utils/stripe");
const Payment = require("../models/payment");
const {
  paymentCreatedPublisher,
  paymentSucceededPublisher,
  paymentFailedPublisher,
} = require("../events/payment-publishers");

const router = express.Router();

// POST /api/payments
router.post("/", currentUser, requireAuth, async (req, res, next) => {
  try {
    const { orderId, currency, amount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.userId !== req.currentUser.id) {
      return res.status(404).json({
        errors: [{ message: "Current user not matched with ordered user!" }],
      });
    }

    if (order.status === "cancelled") {
      return res.status(404).json({
        errors: [
          { message: "Order has been cancelled, can't procced for payment!" },
        ],
      });
    }

    // Use Stripe to process the payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.price * 100,
      currency: "inr",
      description: `Purchased tickets for event: ${order.id}`,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id }, // Include orderId in metadata
    });

    console.log({ paymentIntent });

    const payment = new Payment({
      orderId: order.id,
      paymentId: paymentIntent.id,
    });
    await payment.save();

    // Emit an event to notify other services about the new payment
    await paymentCreatedPublisher({
      id: payment.id,
      orderId: payment.orderId,
      paymentId: payment.paymentId,
    });

    return res.status(201).json({
      // payment,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ message: "Server error" }] });
  }
});

// /api/payments/webhooks/stripe
// Hit by Stripe directly (Not Us) -- (We added this endpoint in stripe webhooks)
router.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }), // Ensure raw body is available
  async (req, res, next) => {
    console.log("Inside /api/payments/webhooks/stripe");
    const sig = req.headers["stripe-signature"];
    console.log("Sig", sig);
    // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const endpointSecret =
      "whsec_7e58bb3bbfef88f65591b5bbbb2e931b3cccf8f906edb012ea8a4aeff3fc2586";

    // Log the raw body
    console.log("Raw body:", req.body.toString());

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntentSucceeded = event.data.object;
        const { orderId, paymentId } = paymentIntentSucceeded.metadata;

        const order = await Order.findOne({ _id: orderId });
        if (!order) {
          console.error("Order not found");
          return;
        }

        // Publish the payment succeeded event
        await paymentSucceededPublisher({
          orderId: orderId,
          paymentId: paymentId,
        });

        break;

      case "payment_intent.payment_failed":
        const paymentIntentFailed = event.data.object;
        const { orderId: orderIdFailed, paymentId: paymentIdFailed } =
          paymentIntentFailed.metadata;

        // Publish the payment failed event
        await paymentFailedPublisher({
          orderId: orderIdFailed,
          paymentId: paymentIdFailed,
        });

        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  }
);

module.exports = router;
