const mongoose = require("mongoose");
const { updateIfCurrentPlugin } = require("mongoose-update-if-current");

const orderSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "ticket" },
    userId: { type: String },
    expiresAt: Date,
    status: {
      type: String,
      default: "created",
      enum: ["created", "cancelled", "pending_payment", "completed", "failed"],
    },
    // created, --> When order created, but ticket (which is trying to order) has not been reserved
    //  cancelled,  --> ticket (which is trying to order) has already been reserved (OR)
    //              --> when the order expires before payment
    //              --> When user cancelled order
    //  pending_payment, --> when order successfully reserved ticket
    //  completed  ---> when order reserved ticket and user done with payment
    // failed  ---> when payment failed
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        // delete ret.__v;
      },
    },
  }
);

orderSchema.set('versionKey', 'version');
// // This will automatically update the ticket when we save it with the same ID and version
orderSchema.plugin(updateIfCurrentPlugin);

const Order = mongoose.models.order || mongoose.model("order", orderSchema);
module.exports = Order;
