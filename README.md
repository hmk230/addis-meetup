# ⚽ Addis Meetup

A full-stack web app for organizing football games across Addis Ababa.

## 📁 Project Structure

```
addis-meetup/
├── backend/          Node.js + Express API
├── frontend/         React + Vite + Tailwind CSS
├── DEPLOYMENT_GUIDE.md   ← START HERE for deployment
└── backend/schema.sql    ← Run this in Supabase
```

## 🚀 Quick Start

See **DEPLOYMENT_GUIDE.md** for full step-by-step instructions.

## 💰 Pricing Logic

- 1 game  → full price (e.g. 350 ETB)
- 2 games → save 25% of 1 game → 612.50 ETB
- 3 games → save 50% of 1 game → 875 ETB
- 4 games → save 50% of 1 game → 1,225 ETB

Multiplied by number of players registered.

## 🔐 Security Features

- Rate limiting on login (10 attempts / 15 min)
- Helmet security headers
- JWT authentication
- bcrypt password hashing (12 rounds)
- Input validation on all endpoints
- MIME type validation on file uploads
- CORS restricted to frontend domain only
