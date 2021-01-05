const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 8000;
var fileupload = require("express-fileupload");
const jwt = require('jsonwebtoken')
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const path = require('path')
const db = require('./api/db')

app.use(fileupload());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());
app.use('/static', express.static(path.join(__dirname, 'assets')))
var userProfile;

app.set('view engine', 'ejs');

app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    db.query(`SELECT * FROM accounts where id='${id}'`, (err, res) => {
        done(err, res.rows[0]);
    })
});

const GOOGLE_CLIENT_ID = '462902351848-onibth7h72jfc63nuqnfjol5h2aqsg1h.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'xJVPltMt8W_d8v6aT8SPHyg3';
passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        //development URL
        callbackURL: "http://localhost:8000/auth/google/callback"
        //production URL
        // callbackURL: "http://heylows-server.herokuapp.com/auth/google/callback"
    },
    function (accessToken, refreshToken, profile, done) {
        let user = {
            id: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile._json.email,
            provider: profile.provider
        }
        let token = jwt.sign({
            email: user.email,
            userID: user.id
        }, 'SECRETKEY');
        user.token = token;
        console.log(user);
        db.query('SELECT * FROM accounts WHERE id = $1', [user.id], (err, res) => {
            if (err) throw err
            if (res.rows.length) {
                return done(null, res.rows[0])
            } else {
                db.query('INSERT INTO accounts(id, email, first_name, last_name, provider) VALUES($1, $2, $3, $4, $5)',
                    [user.id, user.email, user.firstName, user.lastName, user.provider])
                db.query('SELECT * FROM accounts WHERE id = $1', [user.id], (err, res) => {
                    if (err) throw err
                    return done(null, res.rows[0])
                })
            }
        })
        userProfile = user
    }
));

app.get('/auth/google',
    passport.authenticate('google', {scope: ['profile', 'email']}));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/'
    }), (req, res) => {
        res.status(200).send({
            "user": userProfile
        })
    });

let router = require('./api/routers/routers')
app.use('/api', router)

app.use(function (req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'});
})

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen(port);

console.log('Running on port: ' + port);