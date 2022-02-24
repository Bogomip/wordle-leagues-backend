const jwt = require('jsonwebtoken');

/**
     * Returns todays game number
     * @returns
     */
 function todaysGame() {
    const first = new Date('2021-6-19').getTime();
    const today = new Date().getTime();
    return Math.floor((today - first) / (1000 * 60 * 60 * 24));
}

/**
 * Generates a rnadom ID
 * @returns
 */
function generateRandomId() {
    const randomWords = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const characterCount = 7;
    let newCode = '';
    // generate an id
    for(let i = 0 ; i < characterCount ; i++) {
        let randomNumber = Math.floor(Math.random() * randomWords.length)
        newCode += randomWords.charAt(randomNumber);
    }
  return newCode;
}

/**
 * Gets the header info from a request and decodes the token to return the user id.
 * @param {*} req
 * @returns
 */
function getUserDataFromToken(req) {
    // decode the token to get the userid without having the user send it.
    const token = req.headers.authorization.split(" ")[1];
    const userData = jwt.decode(token);
    return userData;
}

module.exports.generateRandomId = generateRandomId;
module.exports.todaysGame = todaysGame;
module.exports.getUserDataFromToken = getUserDataFromToken;
