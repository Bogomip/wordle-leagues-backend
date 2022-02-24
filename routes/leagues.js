const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const league = require('../models/league');
const methods = require('../methods/methods');
const user = require('../models/user');
const message = require('../models/messages');
const result = require('../models/result');
const leagues = require('../models/league');
// NEED TO ADD MODELS FOR THIS DATA TO THE TOP OF HERE...

/**
 * Takes user data and results from a league user query and determines the winner and runner up from the data.
 * pass in an optional array of the fields you want to take from the user data.
 *
 * @param {*} usersData
 * @param {*} resultsData
 * @param {*} scoreArray
 * @param {*} fields
 * @returns
 */
function calculateLeagueWinners(usersData, resultsData, scoreArray, fields = ['_id']) {

    let winner = { score: 0 };
    let runnerUp = { score: 0 };

    // set empty arrays for all fields
    fields.map(temp => {
        winner[temp] = new Array();
        runnerUp[temp] = new Array();
    });

    for(let i = 0 ; i < usersData.length ; i++) {
        // total score..
        let totalScore = 0;
        // get the scores for this user...
        const userScores = resultsData.filter(temp => temp.user.toString() === usersData[i]._id.toString());
        // then remove from the array so next iterations are faster...
        resultsData.filter(temp => temp.user.toString() !== usersData[i]._id.toString());

        // and create a scores array...
        // and calculate a score for the user...
        userScores.forEach(result => totalScore += scoreArray[result.score]);

        // then decide if they are a winner or a runnerup or nothing..
        // also set them as winner if they are the first person through the loop!
        if(totalScore > winner.score || i === 0) {
            runnerUp = {...winner};    // the winner is now the runner up
            // iterate over all required keys...
            for(let o = 0 ; o < fields.length ; o++) winner[fields[o]] = [usersData[i][fields[o]]];
            winner.score = totalScore;
        } else if (totalScore === winner.score) {
            // equal to the winner
            for(let o = 0 ; o < fields.length ; o++) winner[fields[o]].push(usersData[i][fields[o]]);
        } else if (totalScore > runnerUp.score) {
            // the new runner up
            for(let o = 0 ; o < fields.length ; o++) runnerUp[fields[o]] = [usersData[i][fields[o]]];
            runnerUp.score = totalScore;
        } else if (totalScore === runnerUp.score) {
            // equal to the runner up
            for(let o = 0 ; o < fields.length ; o++) runnerUp[fields[o]].push(usersData[i][fields[o]]);
        } // else they place no where!
    }
    return [winner, runnerUp];
}

/**
 * Constructs a string from the winner array { name: [winner with same score], score: number }
 * and returns it...
 * @param {*} winnerArray
 * @param {*} runnerUpArray
 */
function winnersAndRunnerUpString(winnerArray, runnerUpArray, namefield = 'username') {

    let winners, runners;

    if(winnerArray[namefield].length > 1) {
        winners = winnerArray[namefield].slice(0, -1).join(', ').concat(` and ${winnerArray[namefield][winnerArray[namefield].length - 2]}`);
    } else winners = winnerArray[namefield][0];

    if(runnerUpArray[namefield].length > 1) {
        runners = runnerUpArray[namefield].slice(0, -1).join(', ').concat(` and ${runnerUpArray[namefield][runnerUp[namefield].length - 2]}`);
    } else runners = runnerUpArray[namefield][0];

    return [winners || '(Nobody won!)', runners || '(Nobody challenged for second!)'];
}

/******
 *
 * ROUTER METHODS
 *
 */

router.post('/create'
    , checkAuth
    , (req, res, next) => {

        const userId = methods.getUserDataFromToken(req).id;
        const name = req.body.name;
        const leagueId = methods.generateRandomId();

        if(name) {
            const newLeague = new league({
                name: name,
                leagueId: leagueId,
                startId: methods.todaysGame(),
                notifications: true,
                admins: [ userId ],
                members: [ userId ]
            })

            newLeague.save().then(result => {

                // set a message to indicate they have created a new league...
                const messageObject = {
                    type: 2, time: new Date().getTime(), users: userId,
                    title: `You just created the '${name}' league!`,
                    content: `A new league was created, hurrah!  To start inviting people to the '${name}' league they will need to use this link (http://localhost:4200/#/joinleague/${leagueId}) or use the league code (${leagueId}) from the leagues page.`
                };

                const messageCreate = new message(messageObject).save();

                // save the message and return it to the user...
                messageCreate.then(result => {
                    res.status(200).json({
                        success: true,
                        data: [messageObject] // will this work?
                    })
                }).catch(error => {
                    res.status(400).json({ success: false, message: `Unable to send message but the league is updated.` })
                })
            }).catch(error => {
                res.status(400).json({ success: false,  message: `Error: ${error}` })
            })

        } else {
            res.status(400).json({
                success: false,
                message: 'Error: A name is required when creating a league.'
            })
        }

    }
)

router.post('/join',
    checkAuth,
    (req, res, next) => {
        const userId = methods.getUserDataFromToken(req).id;
        const leagueCode = req.body.leagueCode;

        league.updateOne({ leagueId: leagueCode }, { $addToSet: { members: userId }}).then(results => {
            res.status(200).json({
                success: true
            })
        }).catch(error => {
            res.status(400).json({
                success: true
            })
        })

})

router.post('/leave',
    checkAuth,
    (req, res, next) => {
        const userId = methods.getUserDataFromToken(req).id;
        const leagueId = req.body.leagueId;

        console.log(leagueId);

        // REUTRNING NULL FOR SOME REASON?

        leagues.findOneAndUpdate({ _id: leagueId}, { $pull: { members : userId }}, { new: true }).then(updatedDocument => {
            // set a message to indicate they have left...
            const messageObject = {
                type: 20, time: new Date().getTime(), users: userId,
                title: `You just left the '${updatedDocument.name}' league!`,
                content: `You chose to leave the ${updatedDocument.name} league. To rejoin you will need the key from someone else in the league.`
            };

            const messageLeave = new message(messageObject).save();

            // save the message and return it to the user...
            messageLeave.then(result => {
                res.status(200).json({
                    success: true,
                    data: [messageObject] // will this work?
                })
            }).catch(error => {
                res.status(400).json({ success: false, message: `Unable to send message but the league is updated.` })
            })
        }).catch(error => {
            res.status(400).json({ success: false, message: `Unable to find league` })
        })

})


router.post(
    '/delete',
    checkAuth,
    (req, res, next) => {
        const leagueId = req.body.leagueId;
        const userId = methods.getUserDataFromToken(req).id;

        console.log(userId);

        league.findOne({ _id: leagueId, admins: { $in : [userId] }}).then(leagueReturned => {
            // user has been found as an admin of this group...
            // get the userlist as they will need to be notified...
            const leagueToDelete = leagueReturned;
            // get the data for the league and the user data too.
            const userQuery = user.find({ _id: { $in : leagueToDelete.members }}, 'username');
            const resultQuery = result.find({ user: { $in : leagueToDelete.members }, wordleId: { $gte: leagueToDelete.startId }}, 'score user');

            // we havwe to go over the whole group on a deletion because
            // we need to know who won!
            Promise.all([userQuery, resultQuery]).then(([users, results]) => {
                // find the winners and runners up, and make nice strings for them
                let [winner, runnerUp] = calculateLeagueWinners(users,results,[0,2,3,4,3,2,1], ['username', '_id']);
                let [winnersString, runnersString] = winnersAndRunnerUpString(winner, runnerUp);

                // got everything so delete away!
                league.deleteOne({ _id: leagueId }).then(deleteCount => {
                    // get the admin name
                    const adminName = users.find(usr => usr._id.toString() === userId.toString()).username;
                    // message to the winner and runner up in the case of draws...
                    sharedWin = winner._id.length > 1 ? `You shared the win with ${winner._id.length} other people. ` : ``;
                    sharedRunner = runnerUp._id.length > 1 ? `You shared second place with ${runnerUp._id.length} other people. ` : ``;

                    // array of messages because osmetimes we ownt have runner ups
                    const currentTime = new Date().getTime();

                    // build the messages
                    const messageToUsersObject = {
                        type: 0, time: currentTime, users: leagueToDelete.members, title: `League '${leagueToDelete.name}' was deleted.`,
                        content: `'${leagueToDelete.name}' league was deleted by ${adminName}. The winners of the final round were ${winnersString} with ${winner.score} points, and the runner ups were ${runnersString} with ${runnerUp.score}.`
                    };

                    const messageToWinnerObject = {
                        type: 11, time: currentTime+1, users: winner._id, title: `You have won the '${leagueToDelete.name}' league!`,
                        content: `You were just declared the winner of the' ${leagueToDelete.name}' league, congratulations! ${sharedWin} You had ${winner.score} points and second place had ${runnerUp.score}.`
                    };

                    const messageToRunnerUpObject = {
                        type: 12, time: currentTime+1, users: runnerUp._id, title: `You have come second in the '${leagueToDelete.name}' league!`,
                        content: `You were just declared the runner up of the '${leagueToDelete.name}' league, congratulations! ${sharedRunner} You had ${runnerUp.score} points and the winner had ${winner.score}.`
                    };

                    const messageToUsers = new message(messageToUsersObject).save();
                    const messageToWinner = new message(messageToWinnerObject).save();
                    const messageToRunnerUp = new message(messageToRunnerUpObject).save();

                    // post all messages and once complete return the message
                    Promise.all([messageToUsers, messageToWinner, messageToRunnerUp]).then(([allRes,winRes,runnerRes]) => {
                        // message posted!
                        // return a copy of the message to be sent to users so it can be dynamically added to the users message bar.
                        let data = [{ ...messageToUsersObject, _id: allRes._id}];
                        let thisUserWon = !!winner._id.find(temp => temp.toString() === userId.toString());
                        let thisUserRunner = !!runnerUp._id.find(temp => temp.toString() === userId.toString());
                        // if the admin who called the delete is winner of the league then create a new message informing of their win...
                        if(thisUserWon) data.push({...messageToWinnerObject, _id: winRes._id });
                        // if the admin who called the delete is runnerup of the league then create a new message informing of their runns up...
                        if(thisUserRunner) data.push({...messageToRunnerUpObject, _id: runnerRes._id });
                        // and return the data to the user...
                        res.status(201).json({ success: true, data: data })
                    }).catch(error => {
                        res.status(400).json({ success: false, message: `Deletion Successful but Members not informed: ${error}` })
                    })
                }).catch(error => {
                    res.status(400).json({ success: false, message: `Deletion Failed: ${error}` })
                })
            }).catch(error => {
                res.status(400).json({ success: false, message: `An error occured whilst trying to delete the league: ${error}` })
            })
        }).catch(error => {
            res.status(400).json({ success: false, message: `Error: ${error}` })
        });
})


router.post(
    '/restart',
    checkAuth,
    (req, res, next) => {

        const leagueId = req.body.leagueId;
        const userId = methods.getUserDataFromToken(req).id;

        league.findOne({ _id: leagueId, admins: { $in : [userId] }}).then(leagueReturned => {
            // user has been found as an admin of this group...
            // get the userlist as they will need to be notified of the restart...
            const leagueToRestart = leagueReturned;
            // get the data for the league and the user data too.
            const userQuery = user.find({ _id: { $in : leagueToRestart.members }}, 'username');
            const resultQuery = result.find({ user: { $in : leagueToRestart.members }, wordleId: { $gte: leagueToRestart.startId }}, 'score user');

            // we havwe to go over the whole group on a restart because we need to know who won!
            Promise.all([userQuery, resultQuery]).then(([users, results]) => {
                // find the winners and runners up, and make nice strings for them
                let [winner, runnerUp] = calculateLeagueWinners(users,results,[0,2,3,4,3,2,1], ['username', '_id']);
                let [winnersString, runnersString] = winnersAndRunnerUpString(winner, runnerUp);
                let winnerId = winner._id || '';
                let runnerId = runnerUp._id || '';
                let newWordleId = methods.todaysGame();

                // got everything so delete away!
                league.updateOne({ _id: leagueId }, { $set : { startId: newWordleId, previousWinner: winnerId, previousRunnerUp: runnerId }}).then(updateResult => {
                    // get the admin name
                    const adminName = users.find(usr => usr._id.toString() === userId.toString()).username;
                    // message to the winner and runner up in the case of draws...
                    sharedWin = winner._id.length > 1 ? `You shared the win with ${winner._id.length} other people. ` : ``;
                    sharedRunner = runnerUp._id.length > 1 ? `You shared second place with ${runnerUp._id.length} other people. ` : ``;

                    // array of messages because osmetimes we ownt have runner ups
                    // build the messages
                    const messageToUsersObject = {
                        type: 1, time: new Date().getTime(), users: leagueToRestart.members, title: `League '${leagueToRestart.name}' was restarted.`,
                        content: `'${leagueToRestart.name}' league was just restarted by ${adminName}. This league had run from ${leagueToRestart.startId} and will now run from today, wordle number ${newWordleId}. The winners of the previous round were ${winnersString} with ${winner.score} points, and the runner up was ${runnersString} with ${runnerUp.score}.`
                    };

                    const messageToWinnerObject = {
                        type: 11, time: new Date().getTime(), users: winner._id, title: `You have won the '${leagueToRestart.name}' league!`,
                        content: `You were just declared the winner of the '${leagueToRestart.name}' league, congratulations! ${sharedWin} You had ${winner.score} points and second place had ${runnerUp.score}. A new league starts today!`
                    };

                    const messageToRunnerUpObject = {
                        type: 12, time: new Date().getTime(), users: runnerUp._id, title: `You have come second in the '${leagueToRestart.name}' league!`,
                        content: `You were just declared the runner up of the '${leagueToRestart.name}' league, congratulations! ${sharedRunner} You had ${runnerUp.score} points and the winner had ${winner.score}. A new league starts today!`
                    };

                    const messageToUsers = new message(messageToUsersObject).save();
                    const messageToWinner = new message(messageToWinnerObject).save();
                    const messageToRunnerUp = new message(messageToRunnerUpObject).save();

                    // post all messages and once complete return the message
                    Promise.all([messageToUsers, messageToWinner, messageToRunnerUp]).then(([allRes,winRes,runnerRes]) => {
                        // message posted!
                        // return a copy of the message to be sent to users so it can be dynamically added to the users message bar.
                        let data = [{ ...messageToUsersObject, _id: allRes._id}];
                        let thisUserWon = !!winner._id.find(temp => temp.toString() === userId.toString());
                        let thisUserRunner = !!runnerUp._id.find(temp => temp.toString() === userId.toString());
                        // if the admin who called the delete is winner of the league then create a new message informing of their win...
                        if(thisUserWon) data.push({...messageToWinnerObject, _id: winRes._id });
                        // if the admin who called the delete is runnerup of the league then create a new message informing of their runns up...
                        if(thisUserRunner) data.push({...messageToRunnerUpObject, _id: runnerRes._id });
                        // and return the data to the user...
                        res.status(201).json({ success: true, data: data })
                    }).catch(error => {
                        res.status(400).json({ success: false, message: `Deletion Successful but Members not informed: ${error}` })
                    })
                }).catch(error => {
                    res.status(400).json({ success: false, message: `Restart Failed: ${error}` })
                })
            }).catch(error => {
                res.status(400).json({ success: false, message: `An error occured whilst trying to restart the league: ${error}` })
            })
        }).catch(error => {
            res.status(400).json({ success: false, message: `Error: ${error}` })
        });
})


router.get(
    '/search/:leagueId'
    , checkAuth
    , (req, res, next) => {
        const leagueId = req.params.leagueId.split('=')[1];

        league.findOne({ leagueId: leagueId }, 'leagueId name members').then(result => {
            res.status(200).json({
                success: true,
                data: { code: result.leagueId, name: result.name, members: result.members.length }
            })
        }).catch(error => {
            res.status(400).json({
                success: false,
                message: `Error: ${error}`
            })
        })
})

router.delete(
    '/removeuser'
    , checkAuth
    , (req, res, next) => {
        const adminId = methods.getUserDataFromToken(req).id;
        const leagueId = req.query.leagueId;
        const userToDelete = req.query.userToDelete;
        const adminName = req.query.adminName;

        league.findOne({ _id: leagueId, admins: { $in : [adminId] }, members: { $in: [userToDelete]} }).then(leagueReturned => {
            // league found, which means the user is a valid admin
            league.updateOne({ _id: leagueId }, { $pull: { members : userToDelete }}).then(result => {
                // if this is find then return a message...
                if(result.modifiedCount === 1) {
                    // success, send a mesage to the removed user and return true
                    const messageToUser = new message({
                        type: 21, time: new Date().getTime(), users: [userToDelete],
                        title: `You were removed from the '${leagueReturned.name}' league!`,
                        content: `You were just removed from the ongoing '${leagueReturned.name}' league by ${adminName}.`
                    });

                    messageToUser.save().then(messageResult => {
                        res.status(200).json({
                            success: true
                        })
                    }).catch(err => {
                        // if the message doesnt send log int he console here...
                        console.log("Local DB fail (L/D/removeuser1): Message failed to add to the db.")
                    })

                } else {
                    // failure
                    res.status(401).json({
                        success: false,
                        message: 'User was not removed: ' + result
                    })
                }
            })
        }).catch(error => {
            res.status(401).json({
                success: false,
                message: 'User was not removed as you either have no permission to remove them from the league, the league doesnt exist, or they have already been removed from the league'
            })
        })
    }
)


module.exports = router;
