const mongoose = require("mongoose");
const {updateIfCurrentPlugin} = require("mongoose-update-if-current")

const ticketSchema = new mongoose.Schema(
  {
    title: String,
    price: Number,
    userId: String,
    orderId: String,
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

ticketSchema.set('versionKey', 'version');
// This will automatically update the ticket when we save it with the same ID and version
ticketSchema.plugin(updateIfCurrentPlugin);

const Ticket = mongoose.models.ticket || mongoose.model("ticket", ticketSchema);

module.exports = Ticket;
