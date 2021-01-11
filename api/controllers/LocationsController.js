'use strict';

const db = require('../db');

module.exports = {
    async get(req, res) {
        try {
            let sql = 'SELECT * FROM locations';
            await db.query(sql, (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                res.status(200).send({
                    locations: response.rows
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
            let sql = 'INSERT INTO locations (location, latitude, longitude) VALUES ($1, $2, $3)';
            await db.query(sql, [req.body.location, req.body.latitude, req.body.longitude], (err, result) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                res.json({ message: 'Create Successfully!' })
            })

        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    },

    async update(req, res) {
        try {
            let sql = 'SELECT * FROM locations WHERE id = $1';
            let data = req.body;
            await db.query(sql, [req.query.locationID], (err, response) => {
                if (err) {
                    return res.status(400).send({
                        msg: err
                    })
                }
                const values = [
                    data.location || response.rows[0].location,
                    data.latitude || response.rows[0].latitude,
                    data.longitude || response.rows[0].longitude
                ]
                db.query('UPDATE locations SET location = $1, latitude = $2, longitude = $3 WHERE id = $4',
                    [...values, response.rows[0].id], (error, result) => {
                        if (error) {
                            return res.status(400).send({
                                msg: error
                            })
                        }
                        res.json({ message: 'Update Successfully!' })
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
            let sql = 'DELETE FROM locations WHERE id = $1';
            await db.query(sql, [req.query.locationID], (err, response) => {
                if (err) throw err;
                res.json({ message: 'Delete Successfully!' })
            })
        } catch (err) {
            res.status(500).send({
                msg: 'Server error!',
                error: err,
            })
        }
    }
}