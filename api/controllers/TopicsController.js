'use strict';

const db = require('../db');
const {v4: uuidv4} = require('uuid');
var Distance = require('geo-distance');
const {dbFirebase} = require('../firebase-config');
const {getUser} = require('../middleware/auth');
var fs = require('fs')

module.exports = {
    async testAPI(req, res) {
        console.log(req.query)
        res.send({
            msg: 'done'
        })
    },

    async getByKeywords(req, res) {
        try {
            const radius = 50;
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);
            var userCoord = {
                lat: user.latitude,
                lon: user.longitude
            }
            console.log(req.query);

            await db.query('SELECT * FROM topics WHERE topic ~* $1 AND category_id = $2', [req.query.key_word, req.query.category_id], async (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                var topics = [];
                for (const element of response.rows) {
                    var topicCoord = {
                        lat: element.latitude,
                        lon: element.longitude
                    }
                    var result = Distance.between(userCoord, topicCoord)
                    var distance = result.human_readable().distance
                    if (result.human_readable().unit === 'm') {
                        distance = distance / 1000;
                    }
                    if (distance <= radius) {
                        if (element.user_list === null) {
                            element.views = 0
                        } else {
                            element.views = element.user_list.length;
                        }
                        delete element.user_list;
                        element.distance = parseFloat(distance);

                        const avatar = await new Promise((resolve, reject) => {
                            db.query(`SELECT avatar FROM accounts WHERE id = '${element.user_id}'`).then(r => {
                                resolve(r)
                            }, err => {
                                reject(err)
                            })
                        })

                        element.userAvatar = avatar.rows[0].avatar

                        var chat = []
                        await dbFirebase.ref(`${element.id}`).once("value", snapshot => {
                            snapshot.forEach(snap => {
                                chat.push(snap.val())
                            });
                            element.conversation = chat;
                        });
                        for (const el of element.conversation) {
                            const userAvatar = await new Promise((resolve, reject) => {
                                db.query(`SELECT avatar FROM accounts WHERE id = '${el.uid}'`).then(r => {
                                    resolve(r)
                                }, err => {
                                    reject(err)
                                })
                            })
                            el.userAvatar = userAvatar.rows[0].avatar
                        }
                        topics.push(element)
                    }
                }

                topics.sort(function (a, b) {
                    return (b.conversation.length) - (a.conversation.length)
                })

                for (const element of topics) {
                    element.conversation = element.conversation.slice(element.conversation.length - 2, element.conversation.length)
                    element.conversation.sort(function (a, b) {
                        return b.timestamp.localeCompare(a.timestamp)
                    })
                }

                res.status(200).send({
                    topics: topics
                })
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async getByTrending(req, res) {
        try {
            const radius = 50;
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);
            var userCoord = {
                lat: user.latitude,
                lon: user.longitude
            }

            await db.query('SELECT * FROM topics', async (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                var topics = [];
                for (const element of response.rows) {
                    var topicCoord = {
                        lat: element.latitude,
                        lon: element.longitude
                    }
                    var result = Distance.between(userCoord, topicCoord)
                    var distance = result.human_readable().distance
                    if (result.human_readable().unit === 'm') {
                        distance = distance / 1000;
                    }
                    if (distance <= radius) {
                        if (element.user_list === null) {
                            element.views = 0
                        } else {
                            element.views = element.user_list.length;
                        }
                        delete element.user_list;
                        element.distance = parseFloat(distance);

                        const avatar = await new Promise((resolve, reject) => {
                            db.query(`SELECT avatar FROM accounts WHERE id = '${element.user_id}'`).then(r => {
                                resolve(r)
                            }, err => {
                                reject(err)
                            })
                        })

                        element.userAvatar = avatar.rows[0].avatar

                        var chat = []
                        await dbFirebase.ref(`${element.id}`).once("value", snapshot => {
                            snapshot.forEach(snap => {
                                chat.push(snap.val())
                            });
                            element.conversation = chat;
                        });
                        for (const el of element.conversation) {
                            const userAvatar = await new Promise((resolve, reject) => {
                                db.query(`SELECT avatar FROM accounts WHERE id = '${el.uid}'`).then(r => {
                                    resolve(r)
                                }, err => {
                                    reject(err)
                                })
                            })
                            el.userAvatar = userAvatar.rows[0].avatar
                        }

                        topics.push(element)
                    }
                }

                topics.sort(function (a, b) {
                    return (b.conversation.length) - (a.conversation.length)
                })

                for (const element of topics) {
                    element.conversation = element.conversation.slice(element.conversation.length - 2, element.conversation.length)
                    element.conversation.sort(function (a, b) {
                        return b.timestamp.localeCompare(a.timestamp)
                    })
                }

                res.status(200).send({
                    topics: topics
                })
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async getByTop(req, res) {
        try {
            const radius = 50;
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);
            var userCoord = {
                lat: user.latitude,
                lon: user.longitude
            }
            var topics = [];

            await db.query('SELECT * FROM topics ORDER BY rating DESC', async (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }

                for (const element of response.rows) {
                    var topicCoord = {
                        lat: element.latitude,
                        lon: element.longitude
                    }
                    var result = Distance.between(userCoord, topicCoord)
                    var distance = result.human_readable().distance
                    if (result.human_readable().unit === 'm') {
                        distance = distance / 1000;
                    }
                    if (distance <= radius) {
                        if (element.user_list === null) {
                            element.views = 0
                        } else {
                            element.views = element.user_list.length;
                        }
                        delete element.user_list;
                        element.distance = parseFloat(distance);

                        const avatar = await new Promise((resolve, reject) => {
                            db.query(`SELECT avatar FROM accounts WHERE id = '${element.user_id}'`).then(r => {
                                resolve(r)
                            }, err => {
                                reject(err)
                            })
                        })

                        element.userAvatar = avatar.rows[0].avatar

                        var conversation = [];
                        await dbFirebase.ref(`${element.id}`).limitToLast(2).once("value", snapshot => {
                            snapshot.forEach(snap => {
                                conversation.push(snap.val())
                                conversation.sort(function (a, b) {
                                    return b.timestamp.localeCompare(a.timestamp)
                                })
                            });
                            element.conversation = conversation
                        });

                        for (const el of element.conversation) {
                            const userAvatar = await new Promise((resolve, reject) => {
                                db.query(`SELECT avatar FROM accounts WHERE id = '${el.uid}'`).then(r => {
                                    resolve(r)
                                }, err => {
                                    reject(err)
                                })
                            })
                            el.userAvatar = userAvatar.rows[0].avatar
                        }

                        topics.push(element)
                    }
                }

                res.status(200).send({
                    topics: topics
                })
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async getByRecent(req, res) {
        try {
            const radius = 50;
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);
            var userCoord = {
                lat: user.latitude,
                lon: user.longitude
            }
            var topics = [];

            await db.query('SELECT * FROM topics ORDER BY created_at DESC', async (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }

                for (const element of response.rows) {
                    var topicCoord = {
                        lat: element.latitude,
                        lon: element.longitude
                    }
                    var result = Distance.between(userCoord, topicCoord)
                    var distance = result.human_readable().distance
                    if (result.human_readable().unit === 'm') {
                        distance = distance / 1000;
                    }
                    if (distance <= radius) {
                        if (element.user_list === null) {
                            element.views = 0
                        } else {
                            element.views = element.user_list.length;
                        }
                        delete element.user_list;
                        element.distance = parseFloat(distance);

                        const avatar = await new Promise((resolve, reject) => {
                            db.query(`SELECT avatar FROM accounts WHERE id = '${element.user_id}'`).then(r => {
                                resolve(r)
                            }, err => {
                                reject(err)
                            })
                        })

                        element.userAvatar = avatar.rows[0].avatar

                        var conversation = [];
                        await dbFirebase.ref(`${element.id}`).limitToLast(2).once("value", snapshot => {
                            snapshot.forEach(snap => {
                                conversation.push(snap.val())
                                conversation.sort(function (a, b) {
                                    return b.timestamp.localeCompare(a.timestamp)
                                })
                            });
                            element.conversation = conversation
                        });

                        for (const el of element.conversation) {
                            const userAvatar = await new Promise((resolve, reject) => {
                                db.query(`SELECT avatar FROM accounts WHERE id = '${el.uid}'`).then(r => {
                                    resolve(r)
                                }, err => {
                                    reject(err)
                                })
                            })
                            el.userAvatar = userAvatar.rows[0].avatar
                        }

                        topics.push(element)
                    }
                }
                res.status(200).send({
                    topics: topics
                })
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async getByLocation(req, res) {
        try {
            let sql = 'SELECT * FROM topics';
            await db.query(sql, async (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                //params
                var paramsCoord = {
                    lat: req.query.lat,
                    lon: req.query.lon
                };

                var topicsInCircle = [];

                for (const element of response.rows) {
                    delete element.user_list
                    var topicCoord = {
                        lat: element.latitude,
                        lon: element.longitude
                    }
                    var result = Distance.between(paramsCoord, topicCoord)
                    var distance = result.human_readable().distance
                    if (result.human_readable().unit === 'm') {
                        distance = distance / 1000;
                    }
                    if (distance <= req.query.radius) {

                        const avatar = await new Promise((resolve, reject) => {
                            db.query(`SELECT avatar FROM accounts WHERE id = '${element.user_id}'`).then(r => {
                                resolve(r)
                            }, err => {
                                reject(err)
                            })
                        })

                        element.userAvatar = avatar.rows[0].avatar
                        topicsInCircle.push(element)
                    }

                }

                res.status(200).send({
                    topics: topicsInCircle
                });
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async create(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);
            var topicID = uuidv4();
            let data = req.body;
            var file;
            var imagesArray = []
            if (req.files) {
                file = req.files.files;
                if (file.length > 5) {
                    throw('imagesExceededMaximum')
                }
                if (file.length !== undefined) {
                    for (const image of file) {
                        imagesArray.push(
                            {
                                name: image.name,
                                image: image.data
                            }
                        )
                    }
                } else {
                    imagesArray.push(
                        {
                            name: file.name,
                            image: file.data
                        }
                    )
                }
            }

            await fs.promises.mkdir(`./assets/topics/${topicID}`, {recursive: true}, err => {
                if (err) throw err
            })
            var imageURLs = [];
            for (const image of imagesArray) {
                await fs.writeFile(`./assets/topics/${topicID}/${image.name}`, image.image, err => {
                    if (err) throw err
                    console.log('File saved!')
                })
                imageURLs.push('http://' + req.headers.host + `/static/topics/${topicID}/${image.name}`)
            }
            let sql = `INSERT INTO topics (id, topic, latitude, longitude, user_id, category_id, direction, images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
            await db.query(sql, [topicID, data.topic, data.latitude, data.longitude, user.id, data.category_id, data.direction, `{${imageURLs.join()}}`], async (err, result) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }

                res.status(201).send({
                    msg: "Created!",
                })
            })

        } catch (err) {
            switch (err) {
                case 'imagesExceededMaximum':
                    res.status(400).send({
                        msg: 'Only maximum of 5 images allowed'
                    })
                default:
                    res.status(500).send({
                        msg: 'Server error!',
                        error: err,
                    })
            }
        }
    },

    async update(req, res) {
        try {
            let data = req.body;
            const values = [data.topic || response.rows[0].topic]
            db.query('UPDATE topics SET topic = $1 WHERE id = $2',
                [...values, req.query.topicID], (error, result) => {
                    if (error) {
                        return res.status(400).send({
                            msg: error
                        })
                    }
                    res.json({message: 'Update Successfully!'})
                })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async delete(req, res) {
        try {
            let sql = 'DELETE FROM conversations WHERE topic_id = $1';
            await db.query(sql, [req.query.topicID], (err, response) => {
                if (err) throw err;
                db.query('DELETE FROM topics WHERE id = $1', [req.query.topicID], (error, result) => {
                    if (err) throw err;
                    res.json({message: 'Delete Successfully!'})
                })
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    }
}