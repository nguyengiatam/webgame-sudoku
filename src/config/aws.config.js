require('dotenv').config({path: `${__dirname}/../../.env`});
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION
});

const S3 = new AWS.S3();

module.exports = S3