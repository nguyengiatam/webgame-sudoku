const model = require('../model/gameModel');

const getGameData = async () => {
    try {
        const answerList = await model.find();
        return answerList;
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getGameData
}