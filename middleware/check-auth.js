// check sif a token is attached...
// validate token...
const jwt = require('jsonwebtoken');

// middleware simple returns a function...
module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.SALT);
        next();
    } catch (error) {
        res.status(401).json({
            message: `Authentication Failed - No Token: ${error}`
        })
    }
}
