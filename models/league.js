const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const leagueSchemea = mongoose.Schema({
  name: { type: String, required: true },
  leagueId: { type: String, required: true },
  startId: { type: Number, required: true },
  notifications: { type: Boolean, required: true },
  previousWinner: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  previousRunnerUp: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }]
});

leagueSchemea.plugin(uniqueValidator);

module.exports = mongoose.model('League', leagueSchemea);
