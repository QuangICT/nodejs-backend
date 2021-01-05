'use strict';

const bcrypt = require('bcrypt');
const db = require('../db');
const {v4: uuidv4} = require('uuid');
const jwt = require('jsonwebtoken');
const {getUser} = require('../middleware/auth');
const nodeMailer = require('nodemailer');
const moment = require('moment');
const crypto = require('crypto');
var fs = require('fs')

module.exports = {
    async detail(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token)
            if (!user) {
                throw 'UserNotExist'
            }
            let sql = 'SELECT * FROM accounts WHERE id = $1';
            db.query(sql, [user.id], (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                res.status(200).send({
                    user: response.rows[0]
                });
            })
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

    async getByID(req, res) {
        try {
            let sql = 'SELECT id, email, first_name, last_name, avatar, badges FROM accounts WHERE id = $1';
            db.query(sql, [req.params.accountID], (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                res.status(200).send({
                    user: response.rows[0]
                });
            })
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

    async update(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);
            var file;
            var avatar = {}
            if (req.files) {
                file = req.files.avatar;
                avatar.name = file.name;
                avatar.image = file.data
            }

            await fs.promises.mkdir(`./assets/user-avatars/${user.id}`, {recursive: true}, err => {
                if (err) throw err
            })
            await fs.writeFile(`./assets/user-avatars/${user.id}/${avatar.name}`, avatar.image, err => {
                if (err) throw err
                console.log('File saved!')
            })

            const userAvatar = 'http://' + req.headers.host + `/static/user-avatars/${user.id}/${avatar.name}`

            let data = req.body;
            await db.query('SELECT * FROM accounts WHERE id = $1', [user.id], (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                const values = [
                    data.first_name || response.rows[0].first_name,
                    data.last_name || response.rows[0].last_name,
                    userAvatar || response.rows[0].avatar,
                    data.badges || response.rows[0].badges
                ]

                let sql = 'UPDATE accounts SET first_name = $1, last_name = $2, avatar = $3, badges = $4 WHERE id = $5';
                db.query(sql, [...values, user.id], (err, result) => {
                    if (err) {
                        return res.status(400).send({
                            msg: err
                        })
                    }
                    res.json({message: 'Update Successfully!'})
                })
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async updateUserLocation(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);
            await db.query('UPDATE accounts SET latitude = $1, longitude = $2 WHERE id = $3',
                [req.body.latitude, req.body.longitude, user.id], (err, result) => {
                    if (err) {
                        return res.status(400).send({
                            msg: err
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

    async updateDeviceToken(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const user = await getUser(token);
            let data = req.body;
            await db.query('SELECT device_token FROM accounts WHERE id = $1', [user.id], async (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }

                var devToken = response.rows[0].device_token || [];
                if (devToken[0] === undefined || !devToken.includes(data.device_token)) {
                    devToken.push(data.device_token)
                }

                let sql = `UPDATE accounts SET device_token = '{${devToken.join()}}'  WHERE id = $1`;
                await db.query(sql, [user.id], (err, result) => {
                    if (err) {
                        return res.status(400).send({
                            msg: err
                        })
                    }
                    res.json({message: 'Update Successfully!'})
                })

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
            let sql = 'DELETE FROM accounts WHERE id = $1';
            await db.query(sql, [req.params.accountID], (err, response) => {
                if (err) throw err;
                res.json({message: 'Delete Successfully!'})
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async register(req, res) {
        try {
            const querySelect = {
                name: 'fetch-account',
                text: "SELECT * FROM accounts WHERE email = $1 AND provider = 'heylows'",
                values: [req.body.email]
            }
            await db.query(querySelect, (err, response) => {
                    if (response.rows.length) {
                        return res.status(409).send({
                            msg: 'This email is already in use!'
                        });
                    } else {
                        bcrypt.hash(req.body.password, 10, (err, hash) => {
                            if (err) {
                                return res.status(500).send({
                                    msg: err
                                });
                            } else {
                                const queryRegister = {
                                    text: 'INSERT INTO accounts(id, email, password, provider) VALUES($1, $2, $3, $4)',
                                    values: [uuidv4(), req.body.email, hash, 'heylows']
                                }
                                db.query(queryRegister, (err, result) => {
                                        if (err) {
                                            return res.status(400).send({
                                                msg: err
                                            });
                                        }
                                        return res.status(201).send({
                                            msg: 'Registered!'
                                        });
                                    }
                                );
                            }
                        })
                    }
                }
            );
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async login(req, res) {
        try {
            await db.query(`SELECT * FROM accounts WHERE email = $1;`, [req.body.email],
                (err, result) => {
                    if (err) {
                        return res.status(400).send({
                            msg: err
                        });
                    }
                    if (!result.rows.length) {
                        return res.status(401).send({
                            msg: 'Incorrect email or password!'
                        });
                    }

                    bcrypt.compare(
                        req.body.password,
                        result.rows[0]['password'],
                        (bErr, bResult) => {
                            if (bErr) {
                                return res.status(401).send({
                                    msg: 'Incorrect email or password!'
                                });
                            }
                            if (bResult) {
                                const token = jwt.sign({
                                        email: result.rows[0].email,
                                        userID: result.rows[0].id
                                    },
                                    'SECRETKEY', {
                                        expiresIn: '7d'
                                    });

                                db.query(`UPDATE accounts SET provider = 'heylows' WHERE id = '${result.rows[0].id}'`)

                                return res.status(200).send({
                                    msg: 'Logged in!',
                                    token,
                                    user: result.rows[0]
                                })
                            }
                            return res.status(401).send({
                                msg: 'Incorrect email or password!'
                            })
                        }
                    )
                })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async recover(req, res) {
        try {
            await db.query('SELECT * FROM accounts WHERE email = $1 AND provider = $2', [req.body.email, 'heylows'], (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                if (!response.rows[0]) {
                    return res.status(401).send({
                        message: 'The email ' + req.body.email + ' is not associated with any account. Double-check your email address and try again'
                    })
                }

                var resetPasswordToken = crypto.randomBytes(20).toString('hex');
                var resetPasswordExpires = Date.now() + 300000;

                db.query('UPDATE accounts SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3 AND provider = $4', [resetPasswordToken, resetPasswordExpires, req.body.email, 'heylows'])
                let transport = nodeMailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'quangtyt98@gmail.com',
                        pass: 'uyfkufdhhhdhaseg'
                    }
                })

                let link = 'http://' + req.headers.host + '/api/accounts/reset/' + resetPasswordToken
                var username
                if (response.rows[0].first_name !== null) {
                    username = response.rows[0].first_name + ' ' + response.rows[0].last_name
                } else {
                    username = response.rows[0].email
                }

                const message = {
                    from: 'quangtyt98@gmail.com',
                    to: req.body.email,
                    subject: "Password Change Request",
                    text: `Hi ${username} \n
                    Please click on the following link ${link} to reset your password. \n\n
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`
                }

                transport.sendMail(message, function (err, info) {
                    if (err) {
                        console.log(err)
                    } else {
                        res.status(200).send({
                            message: 'A reset email has been sent to ' + req.body.email + '.'
                        })
                    }
                })
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async reset(req, res) {
        try {
            await db.query('SELECT * FROM accounts WHERE reset_password_token = $1', [req.params.resetToken], (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                if (!response.rows[0]) {
                    return res.status(401).send({
                        message: 'Password reset token is invalid.'
                    })
                } else {
                    if (Date.now() > response.rows[0].reset_password_expires) {
                        db.query('UPDATE accounts SET reset_password_token = $1, reset_password_expires = $2 WHERE reset_password_token = $3',
                            [null, null, req.params.resetToken])
                        return res.status(401).send({
                            message: 'Password reset token has expired.'
                        })
                    }
                }
                res.status(200).send({
                    message: 'Valid'
                })
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async resetPassword(req, res) {
        await db.query('SELECT * FROM accounts WHERE reset_password_token = $1', [req.params.resetToken], (err, response) => {
            if (err) {
                return res.status(400).send({
                    msg: err
                })
            }
            if (!response.rows[0]) {
                return res.status(401).send({
                    message: 'Password reset token is invalid.'
                })
            } else {
                if (Date.now() > response.rows[0].reset_password_expires) {
                    return res.status(401).send({
                        message: 'Password reset token has expired.'
                    })
                }
            }

            var newPassword = req.body.password;
            var confirmPassword = req.body.confirmPassword;

            if (newPassword !== confirmPassword) {
                return res.status(400).send({
                    message: 'Your passwords do not match!'
                })
            }

            bcrypt.hash(newPassword, 10, (err, hash) => {
                if (err) {
                    return res.status(500).send({
                        msg: err
                    });
                } else {
                    db.query('UPDATE accounts SET password = $1, reset_password_token = $2, reset_password_expires = $3 WHERE reset_password_token = $4',
                        [hash, null, null, req.params.resetToken], (err, result) => {
                            if (err) {
                                return res.status(400).send({
                                    msg: err
                                })
                            }
                            let transport = nodeMailer.createTransport({
                                service: 'Gmail',
                                auth: {
                                    user: 'quangtyt98@gmail.com',
                                    pass: 'uyfkufdhhhdhaseg'
                                }
                            })

                            var username
                            if (response.rows[0].first_name !== null) {
                                username = response.rows[0].first_name + ' ' + response.rows[0].last_name
                            } else {
                                username = response.rows[0].email
                            }

                            const message = {
                                from: 'quangtyt98@gmail.com',
                                to: response.rows[0].email,
                                subject: "Your Password Has Been Updated",
                                text: `Hi ${username} \n
                                This is a confirmation that the password for your account ${response.rows[0].email} has just been changed`
                            }

                            transport.sendMail(message, function (err, info) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    res.status(200).send({
                                        message: 'Your password has been updated.'
                                    })
                                }
                            })
                        })
                }
            })
        })
    }
}
