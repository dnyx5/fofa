/**
 * Vercel Serverless Function - FOFA Backend API
 * Handles: auth (with Ethereum DID), profiles, loyalty scoring,
 *          fan interactions (match attendance, merch, social media)
 */

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import crypto from "crypto";

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "fofa-prod-secret-key-change-this";
const DATA_DIR = "/tmp/fofa-data";

// X (Twitter) OAuth 2.0 Configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || "";
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || "";
const TWITTER_CALLBACK_URL = process.env.TWITTER_CALLBACK_URL || "https://fofa-xi.vercel.app/api/twitter/callback";
const TWITTER_DEMO_MODE = !TWITTER_CLIENT_ID; // Auto-enable demo when no keys

// Football club X accounts to track interactions with
const TRACKED_CLUBS = [
  { handle: "ManUtd", name: "Manchester United", id: "558797310" },
  { handle: "Arsenal", name: "Arsenal", id: "34613288" },
  { handle: "LFC", name: "Liverpool FC", id: "19583545" },
  { handle: "ChelseaFC", name: "Chelsea FC", id: "22910295" },
  { handle: "ManCity", name: "Manchester City", id: "45733154" },
  { handle: "SpursOfficial", name: "Tottenham Hotspur", id: "121402638" },
  { handle: "FCBarcelona", name: "FC Barcelona", id: "15473839" },
  { handle: "realmadrid", name: "Real Madrid", id: "169897984" },
  { handle: "BayernMunich", name: "Bayern Munich", id: "784614361" },
  { handle: "PSG_English", name: "Paris Saint-Germain", id: "25385012" },
  { handle: "Juventusfc", name: "Juventus", id: "84886695" },
  { handle: "acmilan", name: "AC Milan", id: "84886695" },
  { handle: "BVB", name: "Borussia Dortmund", id: "110585741" },
  { handle: "Inter", name: "Inter Milan", id: "145289938" },
  { handle: "OfficialASRoma", name: "AS Roma", id: "123456789" },
];

// Temporary store for OAuth state/PKCE (in production, use Redis or similar)
const oauthStates = new Map();

// In-memory database (persists during function execution)
let db = {
  users: {},
  activities: [],
  interactions: [],          // on-chain-style interaction log
  nextUserId: 1,
  nextActivityId: 1,
  nextInteractionId: 1,
};

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const USERS_FILE = path.join(DATA_DIR, "users.json");
    const ACTIVITIES_FILE = path.join(DATA_DIR, "activities.json");
    const INTERACTIONS_FILE = path.join(DATA_DIR, "interactions.json");

    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
      db.users = data.users || {};
      db.nextUserId = data.nextUserId || Object.keys(db.users).length + 1;
    }

    if (fs.existsSync(ACTIVITIES_FILE)) {
      const data = JSON.parse(fs.readFileSync(ACTIVITIES_FILE, "utf-8"));
      db.activities = data.activities || [];
      db.nextActivityId = data.nextActivityId || db.activities.length + 1;
    }

    if (fs.existsSync(INTERACTIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(INTERACTIONS_FILE, "utf-8"));
      db.interactions = data.interactions || [];
      db.nextInteractionId = data.nextInteractionId || db.interactions.length + 1;
    }
  } catch (e) {
    console.error("Database initialization error:", e.message);
  }
}

function saveDatabase() {
  try {
    const USERS_FILE = path.join(DATA_DIR, "users.json");
    const ACTIVITIES_FILE = path.join(DATA_DIR, "activities.json");
    const INTERACTIONS_FILE = path.join(DATA_DIR, "interactions.json");

    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify({ users: db.users, nextUserId: db.nextUserId }, null, 2)
    );

    fs.writeFileSync(
      ACTIVITIES_FILE,
      JSON.stringify({ activities: db.activities, nextActivityId: db.nextActivityId }, null, 2)
    );

    fs.writeFileSync(
      INTERACTIONS_FILE,
      JSON.stringify({ interactions: db.interactions, nextInteractionId: db.nextInteractionId }, null, 2)
    );
  } catch (e) {
    console.error("Database save error:", e.message);
  }
}

// ============================================================================
// LOYALTY SCORING
// ============================================================================

function getUserLoyaltyScores(userId) {
  const userActivities = db.activities.filter(a => a.user_id === userId);

  const engagement = userActivities
    .filter(a => a.activity_type === "engagement")
    .reduce((sum, a) => sum + a.points, 0);
  const passion = userActivities
    .filter(a => a.activity_type === "passion")
    .reduce((sum, a) => sum + a.points, 0);
  const knowledge = userActivities
    .filter(a => a.activity_type === "knowledge")
    .reduce((sum, a) => sum + a.points, 0);
  const consistency = userActivities
    .filter(a => a.activity_type === "consistency")
    .reduce((sum, a) => sum + a.points, 0);
  const community = userActivities
    .filter(a => a.activity_type === "community")
    .reduce((sum, a) => sum + a.points, 0);
  const growth = userActivities
    .filter(a => a.activity_type === "growth")
    .reduce((sum, a) => sum + a.points, 0);

  const total = engagement + passion + knowledge + consistency + community + growth;

  let level = "apprentice";
  if (total >= 5000) level = "legend";
  else if (total >= 3000) level = "master";
  else if (total >= 1500) level = "veteran";
  else if (total >= 500) level = "devotee";
  else if (total >= 100) level = "supporter";

  return {
    engagement_score: engagement,
    passion_score: passion,
    knowledge_score: knowledge,
    consistency_score: consistency,
    community_score: community,
    growth_score: growth,
    total_score: total,
    level,
    updated_at: new Date().toISOString(),
  };
}

// ============================================================================
// SIMULATED ON-CHAIN TRANSACTION
// ============================================================================

/**
 * Simulates recording an interaction on the Ethereum blockchain.
 * In production, this would send a real tx to the FOFAPassport contract.
 * For now it generates a deterministic fake tx hash so the UX is realistic.
 */
function simulateOnChainTx(userWallet, interactionType, metadata) {
  const payload = JSON.stringify({ userWallet, interactionType, metadata, ts: Date.now() });
  const txHash = ethers.id(payload); // keccak-256 hash
  return {
    txHash,
    blockNumber: Math.floor(Math.random() * 1000000) + 19000000,
    network: "ethereum-simulated",
    status: "confirmed",
    timestamp: new Date().toISOString(),
  };
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
// EXPRESS APP SETUP
// ============================================================================

const app = express();
app.use(express.json());
app.use(cors());

// Initialize database on startup
initDatabase();

// ============================================================================
// AUTH ROUTES
// ============================================================================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, username, display_name, favorite_club } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "Email, password, and username required" });
    }

    const exists = Object.values(db.users).find(
      u => u.email === email || u.username === username
    );

    if (exists) {
      return res.status(409).json({ error: "Email or username already exists" });
    }

    // -- Generate Ethereum wallet & DID --
    const wallet = ethers.Wallet.createRandom();
    const did = `did:fofa:${wallet.address}`;

    const hashedPassword = await bcryptjs.hash(password, 10);
    const userId = db.nextUserId++;

    db.users[userId] = {
      id: userId,
      email,
      password: hashedPassword,
      username,
      display_name: display_name || username,
      favorite_club: favorite_club || "",
      profile_pic: null,
      bio: null,
      // -- DID / Wallet fields --
      did,
      wallet_address: wallet.address,
      wallet_private_key_encrypted: wallet.privateKey, // In production, encrypt this!
      wallet_mnemonic: wallet.mnemonic?.phrase || null,
      // -- timestamps --
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveDatabase();

    const token = jwt.sign({ userId, email, username }, JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: userId,
        email,
        username,
        display_name: display_name || username,
        did,
        wallet_address: wallet.address,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = Object.values(db.users).find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await bcryptjs.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        favorite_club: user.favorite_club,
        did: user.did,
        wallet_address: user.wallet_address,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// USER ROUTES
// ============================================================================

app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = db.users[req.user.userId];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const scores = getUserLoyaltyScores(req.user.userId);
    const userInteractions = db.interactions
      .filter(i => i.user_id === req.user.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Compute passport stats
    const matchCount = userInteractions.filter(i => i.interaction_type === "match_attendance").length;
    const merchCount = userInteractions.filter(i => i.interaction_type === "merch_purchase").length;
    const socialCount = userInteractions.filter(i => i.interaction_type === "social_media").length;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        favorite_club: user.favorite_club,
        bio: user.bio,
        profile_pic: user.profile_pic,
        did: user.did,
        wallet_address: user.wallet_address,
        created_at: user.created_at,
      },
      loyalty: scores,
      passport: {
        match_attendance: matchCount,
        merch_purchases: merchCount,
        social_media: socialCount,
        total_interactions: userInteractions.length,
        interactions: userInteractions.slice(0, 50),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const { display_name, bio, favorite_club, profile_pic } = req.body;
    const user = db.users[req.user.userId];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (display_name) user.display_name = display_name;
    if (bio !== undefined) user.bio = bio;
    if (favorite_club) user.favorite_club = favorite_club;
    if (profile_pic) user.profile_pic = profile_pic;

    user.updated_at = new Date().toISOString();
    saveDatabase();

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
        did: user.did,
        wallet_address: user.wallet_address,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PASSPORT INTERACTION ROUTES (on-chain-style)
// ============================================================================

/**
 * POST /api/passport/interact
 * Log a fan interaction: match_attendance | merch_purchase | social_media
 * Each one is recorded in the DB and a simulated on-chain tx is returned.
 */
app.post("/api/passport/interact", authenticateToken, async (req, res) => {
  try {
    const { interaction_type, metadata } = req.body;

    const VALID_TYPES = ["match_attendance", "merch_purchase", "social_media"];
    if (!interaction_type || !VALID_TYPES.includes(interaction_type)) {
      return res.status(400).json({
        error: `interaction_type must be one of: ${VALID_TYPES.join(", ")}`,
      });
    }

    const user = db.users[req.user.userId];
    if (!user) return res.status(404).json({ error: "User not found" });

    // Points per interaction type
    const POINTS_MAP = {
      match_attendance: 50,
      merch_purchase: 30,
      social_media: 10,
    };

    // Activity-type mapping for loyalty scores
    const LOYALTY_MAP = {
      match_attendance: "passion",
      merch_purchase: "engagement",
      social_media: "community",
    };

    const points = POINTS_MAP[interaction_type];
    const meta = metadata || {};

    // Simulate on-chain transaction
    const txResult = simulateOnChainTx(user.wallet_address, interaction_type, meta);

    // Save interaction
    const interaction = {
      id: db.nextInteractionId++,
      user_id: req.user.userId,
      interaction_type,
      metadata: meta,
      points,
      tx_hash: txResult.txHash,
      block_number: txResult.blockNumber,
      network: txResult.network,
      created_at: new Date().toISOString(),
    };

    db.interactions.push(interaction);

    // Also add to legacy activity log for loyalty scoring
    db.activities.push({
      id: db.nextActivityId++,
      user_id: req.user.userId,
      activity_type: LOYALTY_MAP[interaction_type],
      description: formatInteractionDescription(interaction_type, meta),
      points,
      created_at: new Date().toISOString(),
    });

    saveDatabase();

    const scores = getUserLoyaltyScores(req.user.userId);

    res.json({
      message: "Interaction recorded",
      interaction,
      tx: txResult,
      loyalty: scores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/passport/interactions
 * List all interactions for the authenticated user.
 */
app.get("/api/passport/interactions", authenticateToken, async (req, res) => {
  try {
    const userInteractions = db.interactions
      .filter(i => i.user_id === req.user.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ interactions: userInteractions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/passport/summary
 * Passport summary: badge counts, DID, wallet, level.
 */
app.get("/api/passport/summary", authenticateToken, async (req, res) => {
  try {
    const user = db.users[req.user.userId];
    if (!user) return res.status(404).json({ error: "User not found" });

    const userInteractions = db.interactions.filter(i => i.user_id === req.user.userId);
    const scores = getUserLoyaltyScores(req.user.userId);

    res.json({
      did: user.did,
      wallet_address: user.wallet_address,
      display_name: user.display_name,
      favorite_club: user.favorite_club,
      member_since: user.created_at,
      level: scores.level,
      total_points: scores.total_score,
      badges: {
        match_attendance: userInteractions.filter(i => i.interaction_type === "match_attendance").length,
        merch_purchase: userInteractions.filter(i => i.interaction_type === "merch_purchase").length,
        social_media: userInteractions.filter(i => i.interaction_type === "social_media").length,
      },
      recent_interactions: userInteractions
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LEGACY LOYALTY ROUTES (kept for backwards compat)
// ============================================================================

app.post("/api/loyalty/activity", authenticateToken, async (req, res) => {
  try {
    const { activity_type, description, points } = req.body;

    if (!activity_type || !points) {
      return res.status(400).json({ error: "activity_type and points required" });
    }

    const activity = {
      id: db.nextActivityId++,
      user_id: req.user.userId,
      activity_type,
      description: description || "",
      points,
      created_at: new Date().toISOString(),
    };

    db.activities.push(activity);
    saveDatabase();

    const scores = getUserLoyaltyScores(req.user.userId);

    res.json({
      message: "Activity logged",
      loyalty: scores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/loyalty/scores", authenticateToken, async (req, res) => {
  try {
    const scores = getUserLoyaltyScores(req.user.userId);
    const recent_activities = db.activities
      .filter(a => a.user_id === req.user.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20);

    res.json({
      scores,
      recent_activities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/loyalty/activities", authenticateToken, async (req, res) => {
  try {
    const activities = db.activities
      .filter(a => a.user_id === req.user.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ activities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// X (TWITTER) OAUTH 2.0 ROUTES
// ============================================================================

/**
 * GET /api/twitter/status
 * Check if user has connected their X account.
 */
app.get("/api/twitter/status", authenticateToken, async (req, res) => {
  try {
    const user = db.users[req.user.userId];
    if (!user) return res.status(404).json({ error: "User not found" });

    const connected = !!user.twitter_access_token;
    res.json({
      connected,
      twitter_username: user.twitter_username || null,
      twitter_name: user.twitter_display_name || null,
      last_synced: user.twitter_last_synced || null,
      demo_mode: TWITTER_DEMO_MODE,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/twitter/auth
 * Start X OAuth 2.0 PKCE flow — redirect user to X authorization page.
 * Pass ?token=JWT in query so we know who's authenticating.
 */
app.get("/api/twitter/auth", async (req, res) => {
  try {
    const jwtToken = req.query.token;
    if (!jwtToken) return res.status(400).json({ error: "Missing token parameter" });

    if (TWITTER_DEMO_MODE) {
      // In demo mode, simulate a successful connection
      const decoded = jwt.verify(jwtToken, JWT_SECRET);
      const user = db.users[decoded.userId];
      if (!user) return res.status(404).json({ error: "User not found" });

      user.twitter_access_token = "demo_token";
      user.twitter_username = "demo_fan";
      user.twitter_display_name = "Demo Fan";
      user.twitter_connected_at = new Date().toISOString();
      saveDatabase();

      // Redirect back to the portal
      const baseUrl = process.env.VITE_APP_URL || "https://fofa-xi.vercel.app";
      return res.redirect(`${baseUrl}/#portal?twitter=connected`);
    }

    // Real OAuth 2.0 PKCE flow
    const state = crypto.randomBytes(16).toString("hex");
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    // Store state → { codeVerifier, jwtToken } for callback
    oauthStates.set(state, { codeVerifier, jwtToken, createdAt: Date.now() });

    // Clean up old states (>10 min)
    for (const [k, v] of oauthStates) {
      if (Date.now() - v.createdAt > 600000) oauthStates.delete(k);
    }

    const scopes = [
      "tweet.read",
      "users.read",
      "like.read",
      "offline.access",
    ].join("%20");

    const authUrl =
      `https://twitter.com/i/oauth2/authorize` +
      `?response_type=code` +
      `&client_id=${TWITTER_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(TWITTER_CALLBACK_URL)}` +
      `&scope=${scopes}` +
      `&state=${state}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;

    res.redirect(authUrl);
  } catch (error) {
    console.error("Twitter auth error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/twitter/callback
 * Handle the redirect back from X. Exchange code for access token.
 */
app.get("/api/twitter/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const baseUrl = process.env.VITE_APP_URL || "https://fofa-xi.vercel.app";

    if (!code || !state || !oauthStates.has(state)) {
      return res.redirect(`${baseUrl}/#portal?twitter=error`);
    }

    const { codeVerifier, jwtToken } = oauthStates.get(state);
    oauthStates.delete(state);

    // Exchange code for token
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: TWITTER_CALLBACK_URL,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Token exchange failed:", await tokenRes.text());
      return res.redirect(`${baseUrl}/#portal?twitter=error`);
    }

    const tokenData = await tokenRes.json();

    // Get user info from X
    const userRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = userRes.ok ? await userRes.json() : { data: {} };

    // Save to user record
    const decoded = jwt.verify(jwtToken, JWT_SECRET);
    const user = db.users[decoded.userId];

    if (user) {
      user.twitter_access_token = tokenData.access_token;
      user.twitter_refresh_token = tokenData.refresh_token || null;
      user.twitter_token_expires = tokenData.expires_in
        ? Date.now() + tokenData.expires_in * 1000
        : null;
      user.twitter_user_id = userData.data?.id || null;
      user.twitter_username = userData.data?.username || null;
      user.twitter_display_name = userData.data?.name || null;
      user.twitter_connected_at = new Date().toISOString();
      saveDatabase();
    }

    res.redirect(`${baseUrl}/#portal?twitter=connected`);
  } catch (error) {
    console.error("Twitter callback error:", error);
    const baseUrl = process.env.VITE_APP_URL || "https://fofa-xi.vercel.app";
    res.redirect(`${baseUrl}/#portal?twitter=error`);
  }
});

/**
 * POST /api/twitter/disconnect
 * Remove X connection from user account.
 */
app.post("/api/twitter/disconnect", authenticateToken, async (req, res) => {
  try {
    const user = db.users[req.user.userId];
    if (!user) return res.status(404).json({ error: "User not found" });

    delete user.twitter_access_token;
    delete user.twitter_refresh_token;
    delete user.twitter_token_expires;
    delete user.twitter_user_id;
    delete user.twitter_username;
    delete user.twitter_display_name;
    delete user.twitter_connected_at;
    delete user.twitter_last_synced;
    saveDatabase();

    res.json({ message: "X account disconnected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/twitter/sync
 * Pull latest X activity and find interactions with tracked club accounts.
 * Awards 10 points per qualifying interaction (like, retweet, comment).
 */
app.post("/api/twitter/sync", authenticateToken, async (req, res) => {
  try {
    const user = db.users[req.user.userId];
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.twitter_access_token) {
      return res.status(400).json({ error: "X account not connected" });
    }

    let clubInteractions = [];

    if (TWITTER_DEMO_MODE || user.twitter_access_token === "demo_token") {
      // === DEMO MODE: generate simulated club interactions ===
      const demoActions = ["like", "retweet", "reply"];
      const sampleClubs = TRACKED_CLUBS.slice(0, 5); // pick first 5 clubs
      const numInteractions = Math.floor(Math.random() * 4) + 2; // 2-5 interactions

      for (let i = 0; i < numInteractions; i++) {
        const club = sampleClubs[Math.floor(Math.random() * sampleClubs.length)];
        const action = demoActions[Math.floor(Math.random() * demoActions.length)];
        const hoursAgo = Math.floor(Math.random() * 72);

        clubInteractions.push({
          action,
          club_handle: `@${club.handle}`,
          club_name: club.name,
          tweet_id: `demo_${Date.now()}_${i}`,
          tweet_preview: generateDemoTweetPreview(club.name, action),
          created_at: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
        });
      }
    } else {
      // === REAL MODE: fetch from X API ===
      // Refresh token if needed
      if (user.twitter_token_expires && Date.now() > user.twitter_token_expires - 60000) {
        const refreshed = await refreshTwitterToken(user);
        if (!refreshed) {
          return res.status(401).json({ error: "X token expired. Please reconnect." });
        }
      }

      // Fetch liked tweets
      if (user.twitter_user_id) {
        try {
          const likesRes = await fetch(
            `https://api.twitter.com/2/users/${user.twitter_user_id}/liked_tweets?max_results=100&tweet.fields=author_id,created_at,text&expansions=author_id`,
            { headers: { Authorization: `Bearer ${user.twitter_access_token}` } }
          );
          if (likesRes.ok) {
            const likesData = await likesRes.json();
            const clubIds = new Set(TRACKED_CLUBS.map(c => c.id));
            const authorMap = {};
            (likesData.includes?.users || []).forEach(u => { authorMap[u.id] = u; });

            (likesData.data || []).forEach(tweet => {
              if (clubIds.has(tweet.author_id)) {
                const author = authorMap[tweet.author_id];
                const club = TRACKED_CLUBS.find(c => c.id === tweet.author_id);
                clubInteractions.push({
                  action: "like",
                  club_handle: `@${author?.username || club?.handle || "unknown"}`,
                  club_name: club?.name || author?.name || "Football Club",
                  tweet_id: tweet.id,
                  tweet_preview: (tweet.text || "").slice(0, 120),
                  created_at: tweet.created_at || new Date().toISOString(),
                });
              }
            });
          }
        } catch (e) {
          console.error("Error fetching likes:", e.message);
        }

        // Fetch recent tweets (for retweets and replies)
        try {
          const tweetsRes = await fetch(
            `https://api.twitter.com/2/users/${user.twitter_user_id}/tweets?max_results=100&tweet.fields=created_at,text,referenced_tweets,in_reply_to_user_id&expansions=referenced_tweets.id,referenced_tweets.id.author_id`,
            { headers: { Authorization: `Bearer ${user.twitter_access_token}` } }
          );
          if (tweetsRes.ok) {
            const tweetsData = await tweetsRes.json();
            const clubIds = new Set(TRACKED_CLUBS.map(c => c.id));
            const refAuthorMap = {};
            (tweetsData.includes?.users || []).forEach(u => { refAuthorMap[u.id] = u; });

            (tweetsData.data || []).forEach(tweet => {
              const refs = tweet.referenced_tweets || [];

              // Check for retweets of club posts
              const retweet = refs.find(r => r.type === "retweeted");
              if (retweet) {
                const refTweets = tweetsData.includes?.tweets || [];
                const original = refTweets.find(t => t.id === retweet.id);
                if (original && clubIds.has(original.author_id)) {
                  const club = TRACKED_CLUBS.find(c => c.id === original.author_id);
                  clubInteractions.push({
                    action: "retweet",
                    club_handle: `@${club?.handle || "unknown"}`,
                    club_name: club?.name || "Football Club",
                    tweet_id: tweet.id,
                    tweet_preview: (original.text || "").slice(0, 120),
                    created_at: tweet.created_at || new Date().toISOString(),
                  });
                }
              }

              // Check for replies to club accounts
              const reply = refs.find(r => r.type === "replied_to");
              if (reply && tweet.in_reply_to_user_id && clubIds.has(tweet.in_reply_to_user_id)) {
                const club = TRACKED_CLUBS.find(c => c.id === tweet.in_reply_to_user_id);
                clubInteractions.push({
                  action: "reply",
                  club_handle: `@${club?.handle || "unknown"}`,
                  club_name: club?.name || "Football Club",
                  tweet_id: tweet.id,
                  tweet_preview: (tweet.text || "").slice(0, 120),
                  created_at: tweet.created_at || new Date().toISOString(),
                });
              }
            });
          }
        } catch (e) {
          console.error("Error fetching tweets:", e.message);
        }
      }
    }

    // Deduplicate — don't re-award points for already-synced tweets
    const existingSyncIds = new Set(
      db.interactions
        .filter(i => i.user_id === req.user.userId && i.metadata?.source === "x_sync")
        .map(i => i.metadata?.tweet_id)
    );

    const newInteractions = clubInteractions.filter(ci => !existingSyncIds.has(ci.tweet_id));

    // Record each new interaction as a social_media passport stamp
    const recorded = [];
    for (const ci of newInteractions) {
      const txResult = simulateOnChainTx(user.wallet_address, "social_media", {
        source: "x_sync",
        ...ci,
      });

      const interaction = {
        id: db.nextInteractionId++,
        user_id: req.user.userId,
        interaction_type: "social_media",
        metadata: {
          source: "x_sync",
          action: ci.action,
          club_handle: ci.club_handle,
          club_name: ci.club_name,
          tweet_id: ci.tweet_id,
          tweet_preview: ci.tweet_preview,
          platform: "X (Twitter)",
        },
        points: 10,
        tx_hash: txResult.txHash,
        block_number: txResult.blockNumber,
        network: txResult.network,
        created_at: ci.created_at,
      };

      db.interactions.push(interaction);
      recorded.push(interaction);

      // Also add to legacy activity log
      db.activities.push({
        id: db.nextActivityId++,
        user_id: req.user.userId,
        activity_type: "community",
        description: `${ci.action} on @${ci.club_handle.replace("@", "")} post`,
        points: 10,
        created_at: ci.created_at,
      });
    }

    user.twitter_last_synced = new Date().toISOString();
    saveDatabase();

    const scores = getUserLoyaltyScores(req.user.userId);

    res.json({
      message: `Synced ${recorded.length} new interaction(s) from X`,
      new_interactions: recorded,
      total_found: clubInteractions.length,
      already_synced: clubInteractions.length - newInteractions.length,
      points_earned: recorded.length * 10,
      loyalty: scores,
      demo_mode: TWITTER_DEMO_MODE || user.twitter_access_token === "demo_token",
    });
  } catch (error) {
    console.error("Twitter sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/twitter/clubs
 * List the tracked football club accounts.
 */
app.get("/api/twitter/clubs", (req, res) => {
  res.json({
    clubs: TRACKED_CLUBS.map(c => ({ handle: c.handle, name: c.name })),
  });
});

// Helper: refresh X access token
async function refreshTwitterToken(user) {
  if (!user.twitter_refresh_token || TWITTER_DEMO_MODE) return false;

  try {
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.twitter_refresh_token,
      }),
    });

    if (!tokenRes.ok) return false;

    const tokenData = await tokenRes.json();
    user.twitter_access_token = tokenData.access_token;
    user.twitter_refresh_token = tokenData.refresh_token || user.twitter_refresh_token;
    user.twitter_token_expires = tokenData.expires_in
      ? Date.now() + tokenData.expires_in * 1000
      : null;
    saveDatabase();
    return true;
  } catch (e) {
    console.error("Token refresh failed:", e.message);
    return false;
  }
}

// Helper: generate demo tweet preview text
function generateDemoTweetPreview(clubName, action) {
  const previews = {
    like: [
      `${clubName} secure a dominant 3-0 victory! What a performance...`,
      `New signing announcement! Welcome to ${clubName}...`,
      `Match day! ${clubName} vs rivals — can't wait for this one...`,
      `${clubName} training session highlights — the squad is looking sharp...`,
    ],
    retweet: [
      `${clubName}: Full time! A brilliant display from the team today...`,
      `${clubName}: Tickets now available for our next home match...`,
      `${clubName}: Congratulations to our Player of the Month...`,
    ],
    reply: [
      `Amazing game! ${clubName} deserved the win today...`,
      `Can't wait for the next match! Come on ${clubName}!...`,
      `Best team in the league! ${clubName} all the way...`,
    ],
  };
  const options = previews[action] || previews.like;
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FOFA API is running — DID + Passport enabled",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// HELPERS
// ============================================================================

function formatInteractionDescription(type, meta) {
  switch (type) {
    case "match_attendance":
      return meta.match_name
        ? `Attended match: ${meta.match_name}`
        : "Attended a match";
    case "merch_purchase":
      return meta.item_name
        ? `Purchased: ${meta.item_name}`
        : "Bought merchandise";
    case "social_media":
      const action = meta.action || "engaged";
      return meta.platform
        ? `${action} on ${meta.platform}`
        : `Social media ${action}`;
    default:
      return "Fan interaction";
  }
}

// ============================================================================
// EXPORT FOR VERCEL
// ============================================================================

export default app;
