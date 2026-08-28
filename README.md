# UNLOST: Smart Lost and Found Management System

[![Repository](https://img.shields.io/badge/GitHub-Daksh--1909%2FUNLOST-blue?logo=github)](https://github.com/Daksh-1909/UNLOST)
[![Author](https://img.shields.io/badge/Author-Daksh-orange)](https://github.com/Daksh-1909)

**UNLOST** is a full-stack web application designed to simplify and digitize the reporting, tracking, and recovery of lost items within institutional campuses. Built with the MERN stack (MongoDB, Express.js, React, Node.js), UNLOST provides secure authentication, real-time item matching, AI assistant support, and role-based administration.

---

## 📌 Repository Information
* **Official Repository**: [https://github.com/Daksh-1909/UNLOST](https://github.com/Daksh-1909/UNLOST)
* **Author / Maintainer**: [Daksh (Daksh-1909)](https://github.com/Daksh-1909)

---

## ✨ Features

- 🔐 **Authentication & Security**
  - JWT & Session-based authentication
  - Google OAuth 2.0 integration
  - Role-based Access Control (User / Admin)
- 📦 **Lost & Found Reporting**
  - Detailed item reporting with metadata & image attachments
  - Category filtering, search, and date-range sorting
  - Claim workflow (Submit claim, request verification, approve/reject)
- 🤖 **AI Support & Analytics**
  - Integrated Gemini AI Chatbot assistant for user queries
  - Admin dashboard with data visualizers (Recharts) & security logs
- 📱 **Modern Responsive UI**
  - React + TypeScript + Tailwind CSS + Framer Motion + GSAP micro-animations

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, GSAP
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Passport.js, JWT
- **AI Integration**: Google Gen AI SDK (`@google/genai`)
- **Deployment & Hosting**: Vercel (Frontend & Backend)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local or MongoDB Atlas instance)

### 1. Clone & Setup
```bash
git clone https://github.com/Daksh-1909/UNLOST.git
cd UNLOST
npm run install:all
```

### 2. Configure Environment Variables

#### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/unlost
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
CLIENT_URL=http://localhost:5173
```

#### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Run Development Servers
To run both frontend and backend concurrently:
```bash
npm run dev
```

Or run individually:
```bash
# Frontend (Vite) -> http://localhost:5173
npm run dev:frontend

# Backend (Express) -> http://localhost:5000
npm run dev:backend
```

---

## 📄 Academic Research & Paper

This repository contains the source code and academic paper research assets for **"UNLOST: A Smart Lost and Found Management System"**.

For details regarding research methodology, architecture design, literature review, and performance analysis, refer to the included document artifacts in the repository root.

---

## 📬 Contact & Links

- **GitHub Repository**: [https://github.com/Daksh-1909/UNLOST](https://github.com/Daksh-1909/UNLOST)
- **Issues & Contributions**: [https://github.com/Daksh-1909/UNLOST/issues](https://github.com/Daksh-1909/UNLOST/issues)
