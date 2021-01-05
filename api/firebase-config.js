require('firebase/auth');
require('firebase/database');

const admin = require('firebase-admin');

const serviceAccount = require('./heylows-app-firebase-adminsdk.json');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://heylows-app.firebaseio.com"
});

module.exports.admin = admin
module.exports.dbFirebase = admin.database();


