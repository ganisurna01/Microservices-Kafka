const express = require("express");
const { currentUser, requireAuth } = require("@ganeshsurnaticketingapp/common");
const Order = require("../models/order");
const {
  orderCreatedPublisher,
  orderCancelledPublisher,
} = require("../events/order-publishers");
const Ticket = require("../models/ticket");

const router = express.Router();

// POST /api/orders
// currentUser middleware intereferes in all requests, as it is mentioned in index.js --> app.use(currentUser);
router.post("/", requireAuth, async (req, res, next) => {
  try {
    // Find the ticket
    const ticket = await Ticket.findById(req.body.ticketId);
    if (!ticket)
      return res
        .status(404)
        .json({ errors: [{ message: "Ticket not found" }] });

    // Make sure that this ticket is not already reserved
    // status other than "cancelled", means the ticket is already reserved
    const existingTicketOrder = await Order.findOne({
      ticketId: req.body.ticketId,
      status: {
        $ne: "cancelled", // OR $in:['created', 'pending_payment', 'completed']
      },
    });
    if (existingTicketOrder) {
      return res.status(400).json({
        errors: [{ message: "This ticket is already reserved" }],
      });
    }

    // Create a new order
    const order = new Order({
      ...req.body,
      userId: req.currentUser.id,
      status: "created",
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes from now 15 * 60 * 1000
    });
    await order.save();

    // Populate the ticket details in the order document
    const populatedOrder = await Order.findById(order.id).populate("ticketId");

    // Publish an event to notify other services about the new order
    orderCreatedPublisher({
      id: order.id,
      userId: order.userId,
      ticketId: populatedOrder.ticketId.id, // populated ref
      price: populatedOrder.ticketId.price, // populated ref
      status: order.status,
      expiresAt: order.expiresAt,
      version: order.version,
    });

    return res.status(201).json({ order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ message: "Server error" }] });
  }
});

// GET /api/orders
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.currentUser.id }).populate(
      "ticketId"
    );
    return res.json({ orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ message: "Server error" }] });
  }
});

// GET /api/orders/:id
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("ticketId");
    if (!order)
      return res.status(404).json({ errors: [{ message: "Order not found" }] });

    // Condition to show only if current user is the order created user.
    if (order.userId !== req.currentUser.id)
      return res.status(401).json({ errors: [{ message: "Unauthorized" }] });

    return res.json({ order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ message: "Server error" }] });
  }
});

// DELETE /api/orders/:id
// actually it is not delete, its just to make status --> "cancelled"
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ errors: [{ message: "Order not found" }] });

    if (order.userId !== req.currentUser.id)
      return res.status(401).json({
        errors: [{ message: "You are not allowed to delete this order" }],
      });

    order.status = "cancelled";
    await order.save();

    // Publish an event to notify other services about the cancelled order
    orderCancelledPublisher({
      id: order.id,
      ticketId: order.ticketId,
      userId: order.userId,
      status: order.status,
      expiresAt: order.expiresAt,
      version: order.version,
    })

    return res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ message: "Server error" }] });
  }
});

module.exports = router;
