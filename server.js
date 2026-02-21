const express = require("express");
const mongoose = require("mongoose");

const User = require("./models/user.model");
const Task = require("./models/task.model");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "./views");

mongoose.connect("mongodb://127.0.0.1:27017/todo_app")
  .then(() => console.log("MongoDB Connected"));

/* ================= USER ================= */

// Tạo user
app.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ================= TRANG CHÍNH ================= */

// Giả lập user hiện tại (demo)
const CURRENT_USER_ID = "6999d7986536fe45b2d3d0fd";

app.get("/", async (req, res) => {
  const tasks = await Task.find()
    .populate("assignedTo", "fullName")
    .populate("completedBy", "fullName");

  const users = await User.find();

  res.render("index", { tasks, users });
});

/* ================= ADMIN TẠO TASK ================= */

app.post("/add-task", async (req, res) => {
  const { title, assignedTo } = req.body;

  const currentUser = await User.findById(CURRENT_USER_ID);

  if (!currentUser || currentUser.role !== "admin") {
    return res.send("Bạn không có quyền tạo task");
  }

  await Task.create({
    title,
    assignedTo: Array.isArray(assignedTo) ? assignedTo : [assignedTo]
  });

  res.redirect("/");
});

/* ================= USER HOÀN THÀNH TASK ================= */

app.post("/complete-task/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task.completedBy.includes(CURRENT_USER_ID)) {
    task.completedBy.push(CURRENT_USER_ID);
  }

  if (task.completedBy.length === task.assignedTo.length) {
    task.status = "done";
  }

  await task.save();
  res.redirect("/");
});

/* ================= XÓA TASK ================= */

app.post("/delete-task/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});