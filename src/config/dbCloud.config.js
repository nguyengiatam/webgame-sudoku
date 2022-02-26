const mongoose = require('mongoose');
require('dotenv').config({path: `${__dirname}/../../.env`});

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://nguyengiatam:qbkzmsiv98@cluster0.j5itf.mongodb.net/webGameSudoku?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 10000000,
    connectTimeoutMS: 100000
  });
}

module.exports = mongoose;