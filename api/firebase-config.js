require('firebase/auth');
require('firebase/database');

const admin = require('firebase-admin');

//production
// const serviceAccount = require('./heylows-app-firebase-adminsdk.json');
//
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://heylows-app.firebaseio.com"
// });

//development
var serviceAccount = require("./heylows-app-development-firebase-adminsdk-7nlhb-e889977dc0.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://heylows-app-development-default-rtdb.firebaseio.com"
});

module.exports.admin = admin
module.exports.dbFirebase = admin.database();


