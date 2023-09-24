const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const User = require('../models/user');
const Result = require('../models/result');
const checkAuth = require('../middleware/check-auth');

const methods = require('../methods/methods');

// NEED TO ADD MODELS FOR THIS DATA TO THE TOP OF HERE...
const generateToken = (email, id, remainLoggedIn) => {
    return jwt.sign({
        email: email, id: id
    }, process.env.SALT, { expiresIn: remainLoggedIn ? '7d' : '1h' });

}

/**
 * Signs up then logs in a user.
 */
router.post('/register', (req, res, next) => {

    bcrypt.hash(req.body.password, 10).then(hashedPassword => {

        const user = new User({
            email: req.body.email,
            username: req.body.username,
            password: hashedPassword,
            joindate: new Date().getTime()
        })

        // then save the user...
        user.save().then(fetchedUser => {
            console.log('User registered:' + fetchedUser.username);
            // save has worked and the user now exists!
            const token = generateToken(fetchedUser.email, fetchedUser._id, false);

            res.status(201).json({
                _id: fetchedUser._id,
                token: token,
                name: fetchedUser.username,
                email: fetchedUser.email,
                joinDate: fetchedUser.joindate
            })
        }).catch(err => {
            res.status(401).json({
                error: err
            })
        })

    });
})

/**
 * Logs in a user.
 */
router.post('/login', (req, res, next) => {

    let fetchedUser;

    console.log(req.body);

    // get the user...
    User.findOne({ email: req.body.email }).then((user) => {
        // user not found...
        if(!user) {
            reject();
        } else {
            // store user data;
            fetchedUser = user;
            // return a promise from brypt comparing the password and the stored password...
            return bcrypt.compare(req.body.password, user.password);
        }
    }).then((result) => {
        if(!result) {
            // if the passwords no not match throw an error
            reject();
        } else {
            console.log('User logged in: ' + req.body.email);
            // password is valid...
            const token = generateToken(fetchedUser.email, fetchedUser._id, req.body.remainLoggedIn );
            // set the header...
            res.status(200).json({
                _id: fetchedUser._id,
                token: token,
                name: fetchedUser.username,
                email: fetchedUser.email,
                joinDate: fetchedUser.joindate
            })
        }
    }).catch((error) => {
        return res.status(401).json({
            message: 'Auth Failed  - There was an issue with some of your credentials.',
            error: error
        })
    })

})

/**
 * submit a score to the database...
 */
router.post(
    '/score',
    checkAuth,
    (req, res, next) => {

        // can remove user id from the call
        const userId = methods.getUserDataFromToken(req).id;

        Result.findOne({ wordleId: req.body.wordleId, user: userId }).then((result) => {
            if(!result) {
                // insert
                const newPost = new Result({
                    user: userId,
                    wordleId: req.body.wordleId,
                    score: req.body.score
                })

                newPost.save().then(result => {
                    res.status(200).json({
                        success: true,
                        message: `Success`
                    })
                }).catch((error) => {
                    res.status(400).json({
                        success: false,
                        message: `Error: ${error}`
                    })
                })

            } else {
                // record is found properly and should be updated with the new score...
                result.updateOne({ score: req.body.score }).then((result) => {
                    res.status(200).json({
                        success: true,
                        message: `Success`
                    })
                }).catch((error) => {
                    res.status(400).json({
                        success: false,
                        message: `Error: ${error}`
                    })
                })
            }

        }).catch((error) => {
            res.status(400).json({
                success: false,
                message: `Error: ${error}`
            })
        })
    }
)

router.get(
        '/checktoken',
        checkAuth,
        (req, res, next) => {
            res.status(200).json({
                success: true
            })
        }
)

module.exports = router;
