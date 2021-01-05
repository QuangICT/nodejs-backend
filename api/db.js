const {Client} = require('pg');

//PRODUCTION
// const connectionString = 'postgres://ectwlyvthblfvm:359e319b29f4bcb222a54ccc6a6ba32d84fd09391b6328ae4006c63e49602b79@ec2-52-203-165-126.compute-1.amazonaws.com:5432/d7ma7nankikpd2'

//DEVELOPMENT
const connectionString = 'postgresql://quang:password@localhost:5432/heylows'

const db = new Client({
    connectionString: connectionString
})

db.connect();

module.exports = db