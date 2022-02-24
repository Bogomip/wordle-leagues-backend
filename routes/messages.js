const express = require('express');
const router = express.Router();
const messages = require('../models/messages')
const checkAuth = require('../middleware/check-auth');
const methods = require('../methods/methods');

router.get('/all', checkAuth, (req, res, next) => {
    // decode the token to get the userid without having the user send it.
    const userid = methods.getUserDataFromToken(req).id;

    messages.find({ users: { $in : userid } }, 'content time title type _id').then(result => {
        res.status(200).json({
            success: true,
            data: result,
            message: 'yes!'
        })
    }).catch(error => {
        res.status(400).json({
            success: false,
            message: 'yes!'
        })
    })

});

router.delete('/delete/:id', checkAuth, (req, res, next) => {
    // decode the token to get the userid without having the user send it.
    const userid = methods.getUserDataFromToken(req).id;
    // get the messageid
    const messageId = req.params.id;

    messages.updateOne({ _id: messageId}, { $pull: { users : userid }}).then(updatedQuantity => {
        res.status(200).json({
            success: true
        })
    }).catch(error => {
        res.status(400).json({
            success: false
        })
    })

});

module.exports = router;
