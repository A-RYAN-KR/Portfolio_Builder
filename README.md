# ✦ PortfolioCraft AI — AI-Powered Portfolio Builder

PortfolioCraft AI is a sophisticated, full-stack application that transforms raw resume data into stunning, professional portfolio websites in seconds. Powered by **Google Gemini AI**, it features a conversational interface that allows users to refine their designs using natural language.

![PortfolioCraft AI Preview](https://github.com/A-RYAN-KR/Portfolio_Builder/raw/main/frontend/public/next.svg) <!-- Replace with actual screenshot later -->

## 🚀 Key Features

- **📄 Resume to Website**: Upload your resume (PDF, DOCX, TXT) and let AI extract your details and craft a portfolio.
- **⚡ Instant Generation**: Generate a complete, self-contained portfolio in seconds using Gemini Pro.
- **💬 Conversational Editing**: Don't like a section? Just tell the AI what to change in plain English.
- **👁️ Live Sandbox Preview**: Powered by **WebContainer API**, see your code run live in a secure, isolated browser environment.
- **🎨 Premium Themes**: Choose between Dark, Light, or Vibrant themes with modern glassmorphism and animations.
- **💳 Payment Integration**: Secure membership and plan upgrades integrated with **Razorpay**.
- **🔐 Secure Auth**: Complete authentication system with JWT-protected routes.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js (App Router)
- **State Management**: React Hooks
- **AI Integration**: Google Generative AI (Gemini Pro)
- **Sandbox Environment**: @webcontainer/api
- **Styling**: Vanilla CSS (Premium Custom Design System)
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js / Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT & Bcryptjs
- **Payments**: Razorpay Node SDK

## 📁 Project Structure

```text
portfolio-builder/
├── frontend/             # Next.js Application
│   ├── app/              # App Router & API Routes
│   ├── components/       # UI Components (Sandbox, Pricing, etc.)
│   ├── lib/              # AI Prompts & WebContainer logic
│   └── public/           # Static Assets
└── backend/              # Express.js Server
    ├── index.js          # Server Entry Point & Routes
    └── .env              # Backend Environment Variables
```

## ⚙️ Environment Variables

### Frontend (`frontend/.env.local`)
```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/A-RYAN-KR/Portfolio_Builder.git
cd Portfolio_Builder
```

### 2. Setup Backend
```bash
cd backend
npm install
# Create .env and add your variables
npm start
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
# Create .env.local and add your variables
npm run dev
```

Visit `http://localhost:3000` to see the app in action!

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by [A-RYAN-KR](https://github.com/A-RYAN-KR)
