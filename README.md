# Rezonance — Premium ATS Resume Analyzer

> 🚀 AI-Powered ATS Resume Analyzer & Student Career Portal

**Rezonance** is a full-stack web application that helps students and job seekers analyze their resumes against Applicant Tracking Systems (ATS), build comprehensive career profiles, and get AI-powered improvement suggestions.

---

## ✨ Features

### 🎯 ATS Resume Analyzer
- **PDF Resume Upload** — Upload your resume PDF and get it parsed instantly
- **AI-Powered Scoring** — Powered by **Google Gemini 2.0 Flash** (with local heuristic fallback)
- **Detailed Breakdown** — Section-wise scores, keyword analysis, formatting check
- **Job Match** — Paste a Job Description for targeted keyword match analysis
- **PDF Report** — Download a full ATS audit report as a PDF

### 👤 Student Career Profile
- **Google OAuth Login** — Secure sign-in with Google
- **Complete Career Portal** — Personal info, education, skills, projects, experience, certifications, coding profiles, achievements, research
- **Profile Completion Tracker** — Visual completion meter with section-wise status
- **Resume Auto-Fill** — Upload a PDF resume and auto-populate your profile
- **ATS Score History** — Track your ATS score improvements over time
- **Demo Data** — Load a sample IIT student profile to explore all features

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | TanStack Start (React + Vite) |
| **Language** | TypeScript |
| **Styling** | TailwindCSS v4 |
| **Authentication** | Google OAuth 2.0 |
| **Database** | Supabase (PostgreSQL) |
| **AI Analysis** | Google Gemini 2.0 Flash API |
| **PDF Processing** | pdf-parse v2 |
| **PDF Generation** | jsPDF |
| **Routing** | TanStack Router |

---

## ⚙️ Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/resumeanayliserpwioi.git
cd resumeanayliserpwioi
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file:
```env
# Google Gemini API Key — https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSy...

# Supabase — https://supabase.com/dashboard
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Google OAuth — https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080)

---

## 📁 Project Structure

```
src/
├── routes/
│   ├── index.tsx       # Homepage + ATS Analyzer
│   ├── profile.tsx     # Student Career Profile
│   └── login.tsx       # Google OAuth Login
├── lib/
│   ├── ats.ts          # ATS Analysis Engine (Gemini + Local fallback)
│   ├── google-auth.ts  # Google OAuth helpers
│   └── supabase.ts     # Supabase client & helpers
└── styles.css          # Global styles
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI analysis. App works without it using local heuristic. |
| `VITE_SUPABASE_URL` | Required | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Required | Supabase anonymous key |
| `VITE_GOOGLE_CLIENT_ID` | Required | Google OAuth Client ID for login |

---

## 📖 Usage

### Analyzing a Resume
1. Go to the **Analyzer** section on the homepage
2. Upload your PDF resume using **Browse File**
3. Optionally paste a Job Description for targeted analysis
4. Click **Run ATS Analysis**
5. View scores, keyword matches, and improvement suggestions
6. Download your **PDF Report**

### Building Your Profile
1. Click **Sign In with Google**
2. Go to **My Profile**
3. Click **🎭 Load Demo Data** to explore with a sample profile
4. Fill in your real data across all sections

---

## 🚀 Deployment (Vercel)

```bash
npm run build
vercel --prod
```
Add all environment variables in your Vercel project settings.

---

## 📄 License

MIT License

---

Built with ❤️ using TanStack Start, Google Gemini AI, and Supabase
