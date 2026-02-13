const express = require("express");
const { currentUser, requireAuth } = require("@ganeshsurnaticketingapp/common");
const Ticket = require("../models/ticket");
const {
  ticketCreatedPublisher,
  ticketUpdatedPublisher,
} = require("../events/ticket-publishers");

const router = express.Router();

// POST /api/tickets
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const ticket = new Ticket({ ...req.body, userId: req.currentUser.id });
    await ticket.save();

    // No need to await this, Because it should not stop returning the response
    ticketCreatedPublisher({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    });

    return res.status(201).json({ ticket });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ message: "Server error" }] });
  }
});

// GET /api/tickets
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tickets = await Ticket.find({});
    return res.json({ tickets });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ message: "Server error" }] });
  }
});

// GET /api/tickets/:id
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("userId");
    if (!ticket)
      return res
        .status(404)
        .json({ errors: [{ message: "Ticket not found" }] });
    // Condition to show only if current user is the ticket created user.
    // if (ticket.userId !== req.currentUser.id) return res.status(401).json({ errors: [{ message: "Unauthorized" }] });
    return res.json({ ticket });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ message: "Server error" }] });
  }
});

// PUT /api/tickets/:id
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res
        .status(404)
        .json({ errors: [{ message: "Ticket not found" }] });
    }

    // Check if the current user is allowed to update the ticket
    if (ticket.userId !== req.currentUser.id) {
      return res.status(401).json({
        errors: [{ message: "You are not allowed to update this ticket" }],
      });
    }

    // Check if the ticket is reserved/locked for any order
    if (ticket.orderId) {
      return res.status(400).json({
        errors: [
          {
            message: "This ticket is reserved for an order " + ticket.orderId,
          },
        ],
      });
    }

    // Update the ticket fields
    ticket.set(req.body); // This updates the ticket with the new data from req.body

    // Save the ticket, which will trigger the version increment
    const updatedTicket = await ticket.save();

    // Publish the ticket updated msg/event
    ticketUpdatedPublisher({
      id: updatedTicket.id,
      title: updatedTicket.title,
      price: updatedTicket.price,
      userId: updatedTicket.userId,
      version: updatedTicket.version,
    });

    // Return the updated ticket
    return res.json({ ticket: updatedTicket });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ message: "Server error" }] });
  }
});

module.exports = router;
