const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  reportId: { 
    type: String, 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  isAnonymous: { 
    type: Boolean, 
    default: false 
  },
  author: { 
    type: String, 
    required: true,
    default: "Anonymous" 
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null 
  },
  // 🚀 FIXED: Now lists of Users instead of a raw number!
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  isReported: {
    type: Boolean,
    default: false 
  },
  isHidden: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model("Comment", commentSchema);