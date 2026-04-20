/**
 * FOFA Personal Portal Backend
 * Express API with SQLite, JWT auth, and Proof of Loyalty engine
 */

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// CONFIG
// ============================================================================

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "fofa-dev-secret-key-change-in-production";
const DB_PATH = path.join(__dirname, "fofa.db");

// ============================================================================
// EXPRESS SETUP
// ============================================================================

const app = express();
app.use(express.json());
app.use(cors());

// ============================================================================
// DATABASE SETUP
// ============================================================================

let db = null;

async function initDatabase() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      favorite_club TEXT,
      profile_pic TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loyalty_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      engagement_score REAL DEFAULT 0,
      passion_score REAL DEFAULT 0,
      knowledge_score REAL DEFAULT 0,
      consistency_score REAL DEFAULT 0,
      community_score REAL DEFAULT 0,
      growth_score REAL DEFAULT 0,
      total_score REAL DEFAULT 0,
      level TEXT DEFAULT 'apprentice',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      description TEXT,
      points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
  `);

  console.log("✓ Database initialized at", DB_PATH);
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, username, display_name, favorite_club } = req.body;

    // Validation
    if (!email || !password || !username) {
      return res.status(400).json({ error: "Email, password, and username required" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.run(
      `INSERT INTO users (email, password, username, display_name, favorite_club) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, hashedPassword, username, display_name || username, favorite_club || ""]
    );

    const userId = result.lastID;

    // Initialize loyalty scores
    await db.run(
      `INSERT INTO loyalty_scores (user_id) VALUES (?)`,
      [userId]
    );

    // Generate JWT
    const token = jwt.sign({ userId, email, username }, JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: userId,
        email,
        username,
        display_name: display_name || username,
      },
    });
  } catch (error) {
    console.error(error);
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        favorite_club: user.favorite_club,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// USER ENDPOINTS
// ============================================================================

// Get current user profile
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await db.get(`SELECT * FROM users WHERE id = ?`, [req.user.userId]);
    const scores = await db.get(`SELECT * FROM loyalty_scores WHERE user_id = ?`, [req.user.userId]);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        favorite_club: user.favorite_club,
        bio: user.bio,
        profile_pic: user.profile_pic,
        created_at: user.created_at,
      },
      loyalty: scores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const { display_name, bio, favorite_club, profile_pic } = req.body;

    await db.run(
      `UPDATE users SET display_name = ?, bio = ?, favorite_club = ?, profile_pic = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [display_name, bio, favorite_club, profile_pic, req.user.userId]
    );

    const user = await db.get(`SELECT * FROM users WHERE id = ?`, [req.user.userId]);

    res.json({
      message: "Profile updated",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        favorite_club: user.favorite_club,
        bio: user.bio,
        profile_pic: user.profile_pic,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LOYALTY SCORING ENDPOINTS
// ============================================================================

// Calculate loyalty scores (Proof of Loyalty engine)
function calculateLoyaltyLevel(totalScore) {
  if (totalScore >= 5000) return "legend";
  if (totalScore >= 3000) return "master";
  if (totalScore >= 1500) return "veteran";
  if (totalScore >= 500) return "devotee";
  if (totalScore >= 100) return "supporter";
  return "apprentice";
}

// Log activity
app.post("/api/loyalty/activity", authenticateToken, async (req, res) => {
  try {
    const { activity_type, description, points } = req.body;

    if (!activity_type || !points) {
      return res.status(400).json({ error: "activity_type and points required" });
    }

    await db.run(
      `INSERT INTO activities (user_id, activity_type, description, points) 
       VALUES (?, ?, ?, ?)`,
      [req.user.userId, activity_type, description || "", points]
    );

    // Recalculate loyalty scores
    const activities = await db.all(`SELECT * FROM activities WHERE user_id = ?`, [req.user.userId]);

    const engagement = activities.filter((a) => a.activity_type === "engagement").reduce((sum, a) => sum + a.points, 0);
    const passion = activities.filter((a) => a.activity_type === "passion").reduce((sum, a) => sum + a.points, 0);
    const knowledge = activities.filter((a) => a.activity_type === "knowledge").reduce((sum, a) => sum + a.points, 0);
    const consistency = activities.filter((a) => a.activity_type === "consistency").reduce((sum, a) => sum + a.points, 0);
    const community = activities.filter((a) => a.activity_type === "community").reduce((sum, a) => sum + a.points, 0);
    const growth = activities.filter((a) => a.activity_type === "growth").reduce((sum, a) => sum + a.points, 0);

    const totalScore = engagement + passion + knowledge + consistency + community + growth;
    const level = calculateLoyaltyLevel(totalScore);

    await db.run(
      `UPDATE loyalty_scores 
       SET engagement_score = ?, passion_score = ?, knowledge_score = ?, consistency_score = ?, 
           community_score = ?, growth_score = ?, total_score = ?, level = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [engagement, passion, knowledge, consistency, community, growth, totalScore, level, req.user.userId]
    );

    const scores = await db.get(`SELECT * FROM loyalty_scores WHERE user_id = ?`, [req.user.userId]);

    res.json({
      message: "Activity logged",
      loyalty: scores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get loyalty scores
app.get("/api/loyalty/scores", authenticateToken, async (req, res) => {
  try {
    const scores = await db.get(`SELECT * FROM loyalty_scores WHERE user_id = ?`, [req.user.userId]);
    const activities = await db.all(
      `SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [req.user.userId]
    );

    res.json({
      scores,
      recent_activities: activities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get activity history
app.get("/api/loyalty/activities", authenticateToken, async (req, res) => {
  try {
    const activities = await db.all(
      `SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json({ activities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "FOFA API is running" });
});

// ============================================================================
// START SERVER
// ============================================================================

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n🟢 FOFA Personal Portal API running on http://localhost:${PORT}\n`);
      console.log(`Database: ${DB_PATH}`);
      console.log(`\nEndpoints ready:`);
      console.log(`  POST   /api/auth/register`);
      console.log(`  POST   /api/auth/login`);
      console.log(`  GET    /api/user/profile`);
      console.log(`  PUT    /api/user/profile`);
      console.log(`  POST   /api/loyalty/activity`);
      console.log(`  GET    /api/loyalty/scores`);
      console.log(`  GET    /api/loyalty/activities\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
