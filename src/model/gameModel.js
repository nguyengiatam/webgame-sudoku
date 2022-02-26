const db = require('../config/dbCloud.config');

const game = new db.Schema({
    answer: String,
    hardest: String,
    hard: String,
    medium: String,
    easy: String
}, {
    collection: 'game-data'
})

const gameModel = db.model('game-data', game);

module.exports = gameModel;