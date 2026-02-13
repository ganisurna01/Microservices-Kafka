const mongoose = require('mongoose');
const { updateIfCurrentPlugin } = require('mongoose-update-if-current');

// For orders, it just need title, price of ticket
const ticketSchema = new mongoose.Schema({
    title: String,
    price: Number,
}, {
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            // delete ret.__v;
        }
    }
})

ticketSchema.set('versionKey', 'version');
// ticketSchema.plugin(updateIfCurrentPlugin);
ticketSchema.pre('save', function(done){
    this.$where = {
        version: this.get('version')-1
    }
    done();
})

const Ticket = mongoose.models.ticket ||  mongoose.model('ticket', ticketSchema);

module.exports = Ticket;