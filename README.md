# Miracle Network

Miracle Network is an athlete development platform built to deliver structured training, performance challenges, and real-time progress tracking for softball athletes.

It connects coaching systems, program design, and athlete execution into a single product experience.

---

## 🚀 Core Concept

The platform is built on a simple principle:

> Navigation stays simple. System depth stays powerful.

Athletes interact through four core actions:

- **Train** → Follow structured development programs  
- **Compete** → Test performance through challenges  
- **Build** → Develop specific movement qualities *(in progress)*  
- **Fix (Improve)** → Address specific issues and weaknesses *(in progress)*  

---

## 🧠 What This Product Does

Miracle Network delivers a complete athlete training loop:

1. Athlete logs in  
2. Selects a system (Train / Compete / Improve)  
3. Executes workouts or challenges  
4. Logs performance metrics  
5. Tracks progress over time  

---

## ⚙️ Current MVP Capabilities

### Training System
- Structured training programs  
- Multi-day workout progression  
- Exercise-level prescriptions (sets, reps, time, score, etc.)  
- Athlete execution flow  
- Workout logging and history  

### Compete System
- 108 Athlete Challenge (live)  
- Challenge-based training structure  
- Performance-driven sessions  
- Built on the same execution engine as training  

### Admin System
- Program creation and editing  
- Workout builder  
- Exercise management  
- Prescription configuration  
- Content attachment (video + media)  

### Athlete Experience
- Dashboard navigation (Train / Compete / Improve)  
- Session-based training flow  
- Real-time performance logging  
- Clean execution UI  

---

## 🏗️ Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS  
- **Backend:** Supabase (Postgres, Auth, Row Level Security)  
- **Architecture:** Server Actions + Supabase integration  

---

## 🧱 System Architecture

The platform is structured into three layers:

### Navigation Layer
Simple athlete entry points:
- Train  
- Compete  
- Build  
- Fix  

### System Layer
Deep structured systems:
- Training programs  
- Challenge systems  
- Skill development modules  

### Execution Layer
Where athletes actually perform:
- Workouts  
- Exercises  
- Sessions  
- Logging  

---

## 🔁 Athlete Flow (MVP)

### Training Flow
Dashboard → Train → Program → Workout → Complete → Return  

### Compete Flow
Dashboard → Compete → Challenge → Workout → Complete → Return  

---

## 📂 Project Structure (Simplified)
src/
app/
(dashboard)/
dashboard/
train/
compete/
improve/
workout/
(admin)/
training/
content/
components/
lib/
supabase/

---

## 🔐 Environment Setup

Create a `.env.local` file in the root:
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

Do not commit `.env.local`. It is ignored via `.gitignore`.

---

## 🛠️ Getting Started

Install dependencies:

Do not commit `.env.local`. It is ignored via `.gitignore`.

---
npm install


Run the development server:


npm run dev


Open:


http://localhost:3000


---

## 📈 Current Status

The MVP athlete loop is live and functional:

- Dashboard navigation connected  
- Training system operational  
- Compete system integrated  
- Workout execution and logging working  
- Admin → Athlete pipeline connected  

---

## 🎯 Next Phase
