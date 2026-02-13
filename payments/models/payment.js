const mongoose = require("mongoose");
const { updateIfCurrentPlugin } = require("mongoose-update-if-current");

const paymentSchema = new mongoose.Schema(
  {
    orderId: String,
    paymentId: String,
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

paymentSchema.set('versionKey', 'version');
// // This will automatically update the ticket when we save it with the same ID and version
paymentSchema.plugin(updateIfCurrentPlugin);

const Payment = mongoose.models.payment || mongoose.model("payment", paymentSchema);
module.exports = Payment;
