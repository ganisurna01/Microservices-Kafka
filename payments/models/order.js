const mongoose = require("mongoose");
const { updateIfCurrentPlugin } = require("mongoose-update-if-current");

const orderSchema = new mongoose.Schema(
  {
    userId: String,
    status: String,
    price: Number
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

orderSchema.set('versionKey', 'version');
// // This will automatically update the ticket when we save it with the same ID and version
orderSchema.plugin(updateIfCurrentPlugin);

const Order = mongoose.models.order || mongoose.model("order", orderSchema);
module.exports = Order;
