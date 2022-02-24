const mongoose = require('mongoose');
const User = require('./user');
const uniqueValidator = require('mongoose-unique-validator');

const resultSchema = mongoose.Schema({
  wordleId: { type: Number, required: true },
  score: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

resultSchema.index({ wordleId: 1, user: 1, score: 1}, { unique: true });
resultSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Result', resultSchema);
