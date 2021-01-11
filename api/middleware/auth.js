const auth = require('jsonwebtoken');
const db = require('../db');

module.exports = {
    isLoggedIn: (req, res, next) => {
        try {
            if (req.headers.authorization) {
                const token = req.headers.authorization.split(' ')[1];
                auth.verify(
                    token,
                    'SECRETKEY'
                );

                next();
            } else {
                return res.status(401).send({
                    msg: 'Your session is invalid!'
                })
            }
        } catch (err) {
            return res.status(401).send({
                msg: 'Your token is invalid!'
            })
        }
    },

    getUser: async function(token) {
        const decoded = auth.verify(token, 'SECRETKEY');
        const user_id = decoded.userID;
        const user = await new Promise(((resolve, reject) => {
            db.query(`SELECT * FROM accounts WHERE id = '${user_id}'`).then(r => {
                resolve(r)
            }, err => {
                reject(err)
            })
        }))
        return user.rows[0];
    }
}