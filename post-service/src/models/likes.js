const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    numberOfLikes: {
        type: Number,
        default: 0
    },
})


const Like = mongoose.model('Like', likeSchema);
module.exports = Like;