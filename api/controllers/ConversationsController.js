'use strict';

const db = require('../db');
const {getUser} = require('../middleware/auth')
const {admin} = require('../firebase-config')
const {dbFirebase} = require('../firebase-config');
const moment = require('moment');

module.exports = {
    async create(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);
            var userList = [];
            if (!user) {
                throw 'UserNotExist'
            }
            await dbFirebase.ref(`${req.body.topicID}`).push({
                content: req.body.message,
                timestamp: moment().format(),
                uid: user.id
            });
            let conversations = [];
            await dbFirebase.ref(`${req.body.topicID}`).once("value", async snapshot => {
                snapshot.forEach(snap => {
                    conversations.push(snap.val())
                });
                conversations.forEach(el => {
                    if (userList.includes(el.uid) === false && el.uid !== user.id) {
                        userList.push(el.uid)
                    }
                })

                var registrationTokens = []
                for (const user of userList) {
                    const device_token = await db.query(`SELECT device_token FROM accounts WHERE id = '${user}'`)
                    registrationTokens.push(...device_token.rows[0].device_token)
                }

                if (registrationTokens[0] !== undefined) {
                    const payload = {
                        notification: {
                            title: `New message`,
                            body: `${req.body.message}`
                        }
                    }
                    admin.messaging().sendToDevice(registrationTokens, payload)
                        .catch(error => {
                            console.log(error)
                        })
                }

                res.status(200).send({
                    msg: 'Sent!'
                })
            });
        } catch (err) {
            switch (err) {
                case ('UserNotExist'):
                    res.status(405).send({
                        msg: 'User does not exist',
                    })
                    break;
                default:
                    res.status(500).send({
                        msg: 'Server error!',
                        error: err,
                    })
            }
        }
    },

    async getConversations(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);
            db.query('SELECT topic, user_id, user_list FROM topics WHERE id = $1', [req.query.topicID], async (err, resTopic) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }

                var userList = resTopic.rows[0].user_list || [];
                if (!userList.includes(user.id) && user.id !== resTopic.rows[0].user_id) {
                    userList.push(user.id)
                }

                await db.query(`UPDATE topics SET user_list = '{${userList.join()}}' WHERE id = $1`, [req.query.topicID]);
                let conversations = [];
                await dbFirebase.ref(`${req.query.topicID}`).once("value", snapshot => {
                    snapshot.forEach(snap => {
                        conversations.push(snap.val())
                    })
                });

                for (const el of conversations) {
                    const userAvatar = await new Promise((resolve, reject) => {
                        db.query(`SELECT avatar FROM accounts WHERE id = '${el.uid}'`).then(r => {
                            resolve(r)
                        }, err => {
                            reject(err)
                        })
                    })
                    el.userAvatar = userAvatar.rows[0].avatar
                }

                res.status(200).send({
                    topic: resTopic.rows[0].topic,
                    conversations: conversations
                })
            });
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async updateMessageEmojis(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);

            let conversations = [];
            await dbFirebase.ref(`${req.query.topicID}`).once("value", async snapshot => {
                await conversations.push(snapshot.val())
                console.log(conversations)

                var updateObject = {};
                var emojis = []
                if (conversations[0][req.body.messageID].emojis !== undefined) {
                    emojis = conversations[0][req.body.messageID].emojis
                }
                var userEmoji = {};
                userEmoji[`${user.id}`] = req.body.ratePercentage
                var arrayObjKeys = []

                emojis.forEach(element => {
                    arrayObjKeys.push(Object.keys(element)[0])
                })

                if (arrayObjKeys.includes(user.id)) {
                    for (const i in emojis) {
                        if (emojis[i][`${user.id}`] !== undefined) {
                            emojis[i][`${user.id}`] = req.body.ratePercentage
                        }
                    }
                } else {
                    emojis.push(userEmoji)
                }

                updateObject[`${req.body.messageID}/emojis`] = emojis
                dbFirebase.ref(`${req.query.topicID}`).update(
                    updateObject
                )
                var postUpdateConversations = []
                await dbFirebase.ref(`${req.query.topicID}`).once("value", snapshot => {
                    postUpdateConversations.push(snapshot.val())
                })
                var sum = 0;
                var length = 0;
                for (const element in postUpdateConversations[0]) {
                    var array = postUpdateConversations[0][element].emojis
                    if (array !== undefined) {
                        length += array.length
                    }
                    for (const i in array) {
                        var objectKey = Object.keys(array[i])
                        sum += array[i][objectKey]
                    }
                }

                var averageRating = Math.round(sum / length)

                await db.query(`UPDATE topics SET rating = '${averageRating}' WHERE id = '${req.query.topicID}'`)

                res.status(200).send({
                    msg: "Sent!"
                })
            });
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    }
}