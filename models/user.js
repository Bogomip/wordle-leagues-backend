const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userScehema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  joindate: { type: Number, required: true }
});

userScehema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userScehema);
