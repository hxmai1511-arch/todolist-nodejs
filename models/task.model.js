const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: String,

  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  completedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  status: {
    type: String,
    enum: ["pending", "done"],
    default: "pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
