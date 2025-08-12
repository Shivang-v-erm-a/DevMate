# Devmate: AI-Powered MERN Project Workspace

Welcome to **Devmate**, an advanced, full-stack project workspace that leverages AI to supercharge developer productivity. This platform is designed to impress recruiters and engineering leaders by showcasing modern best practices, robust architecture, and seamless user experience.

## 🚀 Features
- **AI Integration:** Utilizes Google Gemini for intelligent code generation and project assistance.
- **Real-Time Collaboration:** Built-in support for multi-user project management and live updates via WebSockets.
- **Authentication & Security:** JWT-based authentication with token blacklisting (Redis-ready, but runs without Redis for local/dev).
- **Modular Architecture:** Clean separation of concerns using controllers, services, and models.
- **Modern Frontend:** React 18, Vite, Tailwind CSS, and Framer Motion for a beautiful, responsive UI.
- **RESTful API:** Express.js backend with robust validation and error handling.
- **Scalable & Maintainable:** Designed for easy extension and production deployment.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Socket.IO
- **AI:** Google Generative AI (Gemini)
- **DevOps Ready:** Easily deployable to Vercel, Netlify, Render, Railway, or your own VPS

## 📦 Project Structure
```
Devmate/
├── backend/    # Express API, MongoDB, Auth, AI, WebSockets
└── frontend/   # React app, Vite, Tailwind CSS
```

## 🌟 Why This Project Stands Out
- **Production-Ready:** Follows best practices for security, scalability, and maintainability.
- **AI-Driven:** Demonstrates ability to integrate and utilize cutting-edge AI APIs.
- **Clean Code:** Modular, well-documented, and easy to understand.
- **Recruiter Appeal:** Showcases both backend and frontend expertise, plus DevOps awareness.

## 🚀 Getting Started
1. **Clone the repo:**
   ```bash
   git clone https://github.com/yourusername/devin.git
   ```
2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   # Add your .env file (see below)
   npm start
   ```
3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 🔑 Environment Variables
- **Backend:** See `backend/.env.example` for required variables (MongoDB URI, JWT secret, AI key, etc.)
- **Frontend:** Set `VITE_API_URL` to your backend endpoint

## 🌍 Deployment
- Deploy backend to Render, Railway, or Heroku
- Deploy frontend to Vercel or Netlify
- Update CORS and environment variables as needed

## 👤 About the Author
**Shivang** — Passionate full-stack developer with a focus on scalable, modern web applications and AI integration. Always eager to learn, build, and deliver impactful solutions.