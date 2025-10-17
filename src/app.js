import express from 'express';
import sqlite3 from 'better-sqlite3';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { checkIpLocation } from './middleware/ipCheck.js';
import { verifyTurnstileToken } from './middleware/turnstileCheck.js';
import { analyzeContent } from './middleware/perspectiveCheck.js';
import SystemMonitor from './middleware/SystemMonitor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Database setup
const db = new sqlite3('data/posts.db');

// Initialize database tables if not already present
db.prepare(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reason TEXT NOT NULL,
    town TEXT,
    state TEXT,
    moderation_status TEXT DEFAULT 'pending',
    moderation_scores TEXT,
    safety_score INTEGER,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Rate limiting table
db.prepare(`
  CREATE TABLE IF NOT EXISTS rate_limits (
    ip_address TEXT PRIMARY KEY,
    submission_count INTEGER DEFAULT 0,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Middleware to protect the /admin routes
function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || auth.split(' ')[1] !== Buffer.from(`admin:${process.env.ADMIN_PASSWORD}`).toString('base64')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required.');
  }
  next();
}

// Admin routes
const adminRouter = express.Router();
adminRouter.use(adminAuth);

adminRouter.get('/', (req, res) => {
  const { status } = req.query;
  let query = `SELECT * FROM posts`;

  if (status === 'pending') {
    query += ` WHERE moderation_status = 'pending'`;
  } else if (status === 'approved') {
    query += ` WHERE moderation_status = 'approved'`;
  } else if (status === 'rejected') {
    query += ` WHERE moderation_status = 'rejected'`;
  }

  query += ` ORDER BY created_at DESC`;

  const posts = db.prepare(query).all();
  const totalCounts = {
    all: db.prepare('SELECT COUNT(*) as count FROM posts').get().count,
    pending: db.prepare("SELECT COUNT(*) as count FROM posts WHERE moderation_status = 'pending'").get().count,
    approved: db.prepare("SELECT COUNT(*) as count FROM posts WHERE moderation_status = 'approved'").get().count,
    rejected: db.prepare("SELECT COUNT(*) as count FROM posts WHERE moderation_status = 'rejected'").get().count
  };

  // Parse moderation scores for display
  posts.forEach(post => {
    if (post.moderation_scores) {
      try {
        post.scores = JSON.parse(post.moderation_scores);
      } catch (e) {
        post.scores = null;
      }
    }
  });

  res.render('admin', { posts, status, totalCounts });
});

adminRouter.post('/posts/:id/approve', (req, res) => {
  const { id } = req.params;
  db.prepare(`UPDATE posts SET moderation_status = 'approved' WHERE id = ?`).run(id);
  res.redirect('/admin');
});

adminRouter.post('/posts/:id/reject', (req, res) => {
  const { id } = req.params;
  db.prepare(`UPDATE posts SET moderation_status = 'rejected' WHERE id = ?`).run(id);
  res.redirect('/admin');
});

adminRouter.post('/posts/:id/delete', (req, res) => {
  const { id } = req.params;
  db.prepare(`DELETE FROM posts WHERE id = ?`).run(id);
  res.redirect('/admin');
});

// Initialize system monitoring
const monitor = new SystemMonitor({
  memoryThreshold: 85,
  cpuThreshold: 85,
});

monitor.start().catch(error => {
  console.error('Failed to start system monitor:', error);
});

// Mount the adminRouter
app.use('/admin', adminRouter);

// Main page - show approved posts and check location for form display
app.get('/', async (req, res) => {
  try {
    const isUS = await checkIpLocation(req);
    const posts = db.prepare(`
      SELECT * FROM posts 
      WHERE moderation_status = 'approved' 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all();
    
    res.render('index', { 
      posts,
      isUS,
      userCountry: isUS ? 'US' : 'outside the US',
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY
    });
  } catch (error) {
    console.error('Error loading posts:', error);
    res.render('index', { 
      posts: [],
      isUS: false,
      userCountry: 'unknown',
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY
    });
  }
});

// Submit a new post
app.post('/submit', async (req, res) => {
  try {
    const isUS = await checkIpLocation(req);
    if (!isUS && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Submissions are only allowed from the United States' });
    }

    const token = req.body['cf-turnstile-response'];
    if (!token) {
      return res.status(400).json({ error: 'Please complete the security check' });
    }

    const isValid = await verifyTurnstileToken(token);
    if (!isValid) {
      return res.status(400).json({ error: 'Security check failed. Please try again.' });
    }
    
    const { reason, town, state } = req.body;
    if (!reason || reason.trim().length < 150) {
      return res.status(400).json({ error: 'Please share your reason for voting (minimum 150 characters)' });
    }

    // Analyze content with Perspective API
    const moderationResult = await analyzeContent(reason);
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Insert post with moderation results
    db.prepare(`
      INSERT INTO posts (
        reason,
        town,
        state,
        ip_address,
        moderation_status,
        moderation_scores,
        safety_score
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      reason.trim(),
      town || null,
      state || null,
      ip_address,
      moderationResult.isAutoApproved ? 'approved' : 'pending',
      JSON.stringify(moderationResult.scores),
      moderationResult.safetyScore
    );

    res.status(200).json({ 
      message: 'Story submitted successfully',
      moderation_status: moderationResult.isAutoApproved ? 'approved' : 'pending'
    });
  } catch (error) {
    console.error('Error submitting post:', error);
    res.status(500).json({ error: 'Failed to submit story. Please try again.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => monitor.stop());
process.on('SIGINT', () => monitor.stop());