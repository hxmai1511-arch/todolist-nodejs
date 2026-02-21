const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    assignedUsers: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            completed: {
                type: Boolean,
                default: false
            }
        }
    ],
    status: {
        type: Boolean,
        default: false
    },
    doneAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);