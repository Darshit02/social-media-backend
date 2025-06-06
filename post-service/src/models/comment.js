const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
     postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    user: {
        userId: {
            type: String, 
            required: true
        },
        username: String, 
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})


const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;