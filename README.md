# Why Did You Vote - Project Specification

## Project Overview
A simple website where anonymous American users (limited by IP) can share why they voted. Users can submit their reasons along with optional personal details (name, town, state). Submissions are checked for spam using AI and displayed in an infinite scroll feed. The entire world can view comments but only Americans (those that vote) can see.

## Core Features
- Anonymous submission form with:
  - Required: Reason for voting
  - Optional: Town, state
- Infinite scroll feed of approved submissions
- US-only posting access (IP geofencing), worldwide view access
- Spam protection and content moderation via Cloudflare Turnstile
- Basic admin panel for post moderation
- Future preparation for ad monetization

## Technical Stack

### Frontend
- EJS Templates
- TailwindCSS for styling
- Cloudflare Turnstile for CAPTCHA

### Backend
- Express
- SQLite for database (simple, reliable, no separate DB service needed)
- Edge caching through Cloudflare
- Perspective API for spam/content moderation
- ES Modules only

### Infrastructure
- Docker/Docker Compose for containerization
- Cloudflare Tunnels for routing/security
- Cloudflare Edge Cache for performance
- Daily GitHub backups of SQLite database

### Security & Performance
- Cloudflare services (free tier):
  - DDoS protection
  - Rate limiting
  - WAF (Web Application Firewall)
  - Edge caching
  - SSL/TLS
  - IP Geolocation

## Content Moderation Flow
1. User submits post
2. Perspective API reviews content
3. If confidence > 90% safe → automatic approval
4. If confidence < 90% → held for admin review
5. Admin can approve/reject held posts

## Initial Project Structure
```
.
├── Dockerfile
├── README.md
├── codebase.md
├── data
│   └── posts.db
├── docker-compose.yml
├── node_modules
├── package-lock.json
├── package.json
├── postcss.config.js
├── src
│   ├── app.js
│   ├── components
│   ├── middleware
│   │   └── ipCheck.js
│   ├── public
│   │   └── css
│   │       ├── output.css
│   │       └── style.css
│   ├── scripts
│   │   └── init-db.js
│   └── views
│       ├── admin.ejs
│       └── index.ejs
└── tailwind.config.js
```

## Ad Integration Planning - Never implemented, didn't match spirit of it
- Placeholder slots every 10 posts
- Matching width/spacing with content
- No ads initially, but structure ready for:
  - Google AdSense
  - Google AdWords

## Backup Strategy
- Daily cron job
- Compressed SQLite backup
- Push to private GitHub repository
- Retain 7 days of backups locally

## Next Steps
1. Set up Docker environment
2. Initialize Svelte project
3. Create basic UI components
4. Implement submission form
5. Create infinite scroll feed structure