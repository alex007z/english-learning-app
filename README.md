# 🌌 AetherLingo - Glassmorphic English Language Learning App

A highly interactive, fast, and visually stunning Single-Page Application (SPA) designed to teach English through gamified learning tracks. Styled with premium **Glassmorphism aesthetics** (frosted translucent containers, neon outlines, and animated breathing mesh gradients) and integrated with **Supabase** for real-time progress syncing.

## ✨ Features

- **Responsive Glassmorphism Design**: Backed by fluid, floating glowing orbs and frosted cards with high saturations and blurs.
- **Dynamic 3-Lesson Curriculum**:
  - **Lesson 1: Greetings & Basics**: Multiple-choice vocabulary questions.
  - **Lesson 2: Daily Routines**: Interactive fill-in-the-blank grammar questions.
  - **Lesson 3: Restaurant / Ordering**: Word unscrambling drag/tap engine to build syntax correctly.
- **Supabase Cloud State Synchronization**: Syncs profiles, experience points (XP), and lesson accuracy percentages in real-time.
- **No-Install Framework**: Pure client-side HTML, CSS, and JS utilizing CDNs. No Node compile complications, no NPM dependencies, zero deployment failures.
- **Native speech synthesis**: Features text-to-speech audio pronunciation using standard Web Speech APIs.
- **Web Audio Sound Effects**: Low-weight, procedurally generated success/error sounds (no heavy static audio file requirements).
- **Celebration Confetti**: Floating vector physics particle canvas rendering on successful curriculum completion.

---

## 🚀 Quick Setup & Installation

### Step 1: Database Setup
1. Create a free account at [Supabase](https://supabase.com).
2. Create a new project.
3. Open your project's **SQL Editor** from the left panel.
4. Open the [schema.sql](schema.sql) file included in this project, copy the entire SQL script, paste it in the editor, and click **Run**.
   - *This will automatically create the tables, security policies, and seed two default students: Emma and Alex.*

### Step 2: Open the Application Locally
Since there are no bundlers or compilers:
- Simply double-click the `index.html` file in your project folder to run it in any modern browser!
- **Alternatively**, run a simple local web server (e.g., using VS Code's Live Server extension or Python):
  ```bash
  python -m http.server 8000
  ```
  Then browse to `http://localhost:8000`.

### Step 3: Connect Supabase
Upon opening the application:
1. It will pre-populate your Database URL: `https://qbeamkqeldkxxjifqyss.supabase.co`.
2. Locate your project's **Anon Key** in Supabase (under Project Settings -> API) and paste it into the configuration screen.
3. Click **Initialize Connection** to unlock the profiles grid!

---

## ⚡ Deployment to Vercel

This application is fully optimized for **Vercel** out of the box with zero configuration!

### Option 1: Vercel CLI (Fastest)
Run the following in the project directory:
```bash
vercel
```

### Option 2: GitHub Integration (Recommended)
1. Initialize a Git repository and push this project directory to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Glassmorphic English app"
   # Add your remote and push
   ```
2. Log into [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your GitHub repository.
4. Click **Deploy**. Vercel will automatically host it as a highly responsive static site!
