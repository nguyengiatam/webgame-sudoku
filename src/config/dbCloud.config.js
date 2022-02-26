const mongoose = require('mongoose');
require('dotenv').config({path: `${__dirname}/../../.env`});

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
}

module.exports = mongoose;