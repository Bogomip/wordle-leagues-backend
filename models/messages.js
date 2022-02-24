const mongoose = require('mongoose');

// used for big messages being sent in bulk to many users,
// restarting of leagues for example.

const messageSchema = mongoose.Schema({
    type: { type: Number, required: true },
    time: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }]
});

module.exports = mongoose.model('Message', messageSchema);
