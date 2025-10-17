// src/scripts/init-db.js
import sqlite3 from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data/posts.db');

// Initialize database
const db = new sqlite3(dbPath);

// Create tables
db.prepare(`
  DROP TABLE IF EXISTS posts
`).run();

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

db.prepare(`
  DROP TABLE IF EXISTS rate_limits
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS rate_limits (
    ip_address TEXT PRIMARY KEY,
    submission_count INTEGER DEFAULT 0,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Insert example posts
const examplePosts = [
  {
    reason: "I voted for Trump because of his strong stance on border security and immigration reform. His commitment to finishing the wall and implementing merit-based immigration policies resonated with my concerns about national security. I'm hoping to see continued focus on protecting our borders and ensuring legal immigration processes are both fair and efficient.",
    town: "Phoenix",
    state: "AZ",
    moderation_status: "approved",
    safety_score: 95,
    created_at: "2024-11-06 14:23:00"
  },
  {
    reason: "The economy under Trump's first term was incredibly strong, with record-low unemployment and a booming stock market. As a small business owner, I appreciated his tax reforms and reduction in regulations. I'm looking forward to seeing more policies that support American businesses and create jobs for our communities.",
    town: "Dallas",
    state: "TX",
    moderation_status: "approved",
    safety_score: 98,
    created_at: "2024-11-06 15:45:00"
  },
  {
    reason: "Energy independence is crucial for America's future, and Trump's policies during his first term proved this was achievable. His support for American energy production, including oil and natural gas, helped keep prices low and reduced our dependence on foreign energy sources. I want to see a return to these policies for affordable energy and American jobs.",
    town: "Pittsburgh",
    state: "PA",
    moderation_status: "approved",
    safety_score: 97,
    created_at: "2024-11-06 16:30:00"
  },
  {
    reason: "As a veteran, I strongly support Trump's commitment to rebuilding our military and taking care of our veterans. His administration made significant improvements to the VA and increased military funding. I'm voting for continued support of our armed forces and better care for those who served our country.",
    town: "Jacksonville",
    state: "FL",
    moderation_status: "approved",
    safety_score: 96,
    created_at: "2024-11-06 17:15:00"
  },
  {
    reason: "The Supreme Court appointments during Trump's first term were crucial in protecting constitutional values and traditional interpretations of law. I believe his commitment to appointing judges who respect the Constitution as written is essential for preserving our democratic principles and individual liberties.",
    state: "OH",
    moderation_status: "approved",
    safety_score: 99,
    created_at: "2024-11-07 09:20:00"
  },
  {
    reason: "Trump's foreign policy approach of putting America first while maintaining peace through strength showed real results. His administration brokered historic peace deals in the Middle East and stood firm against adversaries without starting new conflicts. I want to see this type of strong but measured foreign policy continue.",
    town: "Miami",
    state: "FL",
    moderation_status: "approved",
    safety_score: 95,
    created_at: "2024-11-07 10:45:00"
  }
];

// Insert each example post
const insert = db.prepare(`
  INSERT INTO posts (
    reason,
    town,
    state,
    moderation_status,
    safety_score,
    created_at
  ) VALUES (?, ?, ?, ?, ?, ?)
`);

examplePosts.forEach(post => {
  insert.run(
    post.reason,
    post.town || null,
    post.state,
    post.moderation_status,
    post.safety_score,
    post.created_at
  );
});

console.log('Database initialized with example posts!');