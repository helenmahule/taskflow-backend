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

// GET all tasks
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Could not get tasks" });
  }
});

// GET single task
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Could not get task" });
  }
});

// POST create task
router.post("/", verifyToken, async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await db.query(
      "INSERT INTO tasks (title, description, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, description, req.user.id]
    );
    res.status(201).json({
      message: "Task created successfully",
      task: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: "Could not create task" });
  }
});

// PUT update task
router.put("/:id", verifyToken, async (req, res) => {
  const { title, description, completed } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await db.query(
      "UPDATE tasks SET title = $1, description = $2, completed = $3 WHERE id = $4 AND user_id = $5 RETURNING *",
      [title, description, completed, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Could not update task" });
  }
});

// DELETE task
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete task" });
  }
});

module.exports = router;