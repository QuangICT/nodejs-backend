'use strict';

const db = require('../db');

module.exports = {
    async fetchAll(req, res) {
        try {
            let sql = 'SELECT * FROM categories';
            await db.query(sql, (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                res.status(200).send({
                    categories: response.rows
                });
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async get(req, res) {
        try {
            let sql = 'SELECT * FROM categories WHERE id = $1';
            await db.query(sql, [req.query.categoryID], (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                res.status(200).send({
                    category: response.rows[0]
                });
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },
}