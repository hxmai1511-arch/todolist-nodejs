const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Task = require("./models/Task");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "./views");

mongoose.connect("mongodb://127.0.0.1:27017/todolist_db")
.then(() => console.log("Kết nối MongoDB thành công"))
.catch(err => console.log("Lỗi kết nối:", err));


app.post("/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const exist = await User.findOne({ username });
        if (exist) {
            return res.json({ message: "Username đã tồn tại" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashed,
            role
        });

        await newUser.save();
        res.json({ message: "Tạo user thành công" });

    } catch (err) {
        res.json({ message: "Lỗi đăng ký", error: err.message });
    }
});

app.post("/tasks", async (req, res) => {
    try {
        const { title, assignedUserIds, adminId } = req.body;

        const admin = await User.findById(adminId);
        if (!admin || admin.role !== "admin") {
            return res.json({ message: "Chỉ admin mới được tạo task" });
        }

        const assignedUsers = assignedUserIds.map(id => ({
            user: id,
            completed: false
        }));

        const task = new Task({ title, assignedUsers });
        await task.save();

        res.json(task);

    } catch (err) {
        res.json({ message: "Lỗi tạo task", error: err.message });
    }
});

app.put("/tasks/:taskId/done/:userId", async (req, res) => {
    try {
        const { taskId, userId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) return res.json({ message: "Không tìm thấy task" });

        const assigned = task.assignedUsers.find(
            a => a.user.toString() === userId
        );

        if (!assigned)
            return res.json({ message: "User không được phân task này" });

        assigned.completed = true;

        const allDone = task.assignedUsers.every(a => a.completed);

        if (allDone) {
            task.status = true;
            task.doneAt = new Date();
        }

        await task.save();
        res.json(task);

    } catch (err) {
        res.json({ message: "Lỗi cập nhật", error: err.message });
    }
});


// getAllTasks
app.get("/tasks", async (req, res) => {
    const tasks = await Task.find().populate("assignedUsers.user", "username");
    res.json(tasks);
});

app.get("/tasks/user/:username", async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    const tasks = await Task.find({ "assignedUsers.user": user._id });
    res.json(tasks);
});

app.get("/tasks/today", async (req, res) => {
    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    const tasks = await Task.find({
        createdAt: { $gte: start, $lte: end }
    });

    res.json(tasks);
});

app.get("/tasks/undone", async (req, res) => {
    const tasks = await Task.find({ status: false });
    res.json(tasks);
});

app.get("/tasks/nguyen", async (req, res) => {
    const users = await User.find({ username: /^nguyen/i });
    const ids = users.map(u => u._id);

    const tasks = await Task.find({
        "assignedUsers.user": { $in: ids }
    });

    res.json(tasks);
});

app.get("/", async (req, res) => {
    const tasks = await Task.find();
    res.render("index", { tasks });
});

app.post("/add-task", async (req, res) => {
    await Task.create({ title: req.body.title });
    res.redirect("/");
});

app.post("/done-task/:id", async (req, res) => {
    await Task.findByIdAndUpdate(req.params.id, {
        status: true,
        doneAt: new Date()
    });
    res.redirect("/");
});

app.post("/delete-task/:id", async (req, res) => {
    await Task.findByIdAndDelete(req.params.id);
    res.redirect("/");
});

app.listen(3000, () => {
    console.log("Server chạy tại http://localhost:3000");
});
