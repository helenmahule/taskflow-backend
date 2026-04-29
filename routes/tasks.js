const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../database");

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token." });
  }
};

// GET all tasks for logged in user
router.get("/", verifyToken, (req, res) => {
  db.all(
    "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id],
    (err, tasks) => {
      if (err) {
        return res.status(500).json({ error: "Could not get tasks" });
      }
      res.json(tasks);
    }
  );
});

// GET single task
router.get("/:id", verifyToken, (req, res) => {
  db.get(
    "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: "Could not get task" });
      }
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    }
  );
});

// POST create new task
router.post("/", verifyToken, (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  db.run(
    "INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)",
    [title, description, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Could not create task" });
      }
      res.status(201).json({
        message: "Task created successfully",
        taskId: this.lastID
      });
    }
  );
});

// PUT update task
router.put("/:id", verifyToken, (req, res) => {
  const { title, description, completed } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  db.run(
    "UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ? AND user_id = ?",
    [title, description, completed, req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Could not update task" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ message: "Task updated successfully" });
    }
  );
});

// DELETE task
router.delete("/:id", verifyToken, (req, res) => {
  db.run(
    "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Could not delete task" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ message: "Task deleted successfully" });
    }
  );
});

module.exports = router;