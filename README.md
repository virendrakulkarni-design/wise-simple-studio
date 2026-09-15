# 🎬 Wise Simple Studio — AI Video & Story Animation Creator

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://virendrakulkarni-design.github.io/wise-simple-studio/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> **AI Video & Animated Story Creator** — Fast, 100% client-side, 7-step storytelling and video animation pipeline.

🌐 **Live Demo:** [https://virendrakulkarni-design.github.io/wise-simple-studio/](https://virendrakulkarni-design.github.io/wise-simple-studio/)

---

## 📌 Project Scope & Independence

**Wise Simple Studio** is an independent application dedicated exclusively to generating animated stories, video scripts, consistent character artwork, video clips, and full movie compilations.
- It is completely independent and separate from our sister project, [**Wise AI Daily**](https://github.com/virendrakulkarni-design/wise-ai-daily) (which is a daily social video summarizer and news digest).
- Zero server backend required — runs entirely client-side on GitHub Pages, Netlify, or any static HTTP server.

---

## 🌟 Key Features

1. **7-Step End-to-End Pipeline**:
   - **Step 0 (Concept)**: Choose visual styles (*Kids 3D Animation, Cinematic Live Action, Anime Storybook, Sci-Fi, Claymation, Vintage 1960s*), target duration (from 15s shorts up to 7-Minute Kids Epics), and aspect ratios (*16:9, 9:16, 1:1*).
   - **Step 1 (Script)**: Scene-by-scene script generator with character descriptions, mood, environment, lighting, camera angles, narration, humorous dialogue, and sound effect cues.
   - **Step 2 (Prompts)**: Expands each scene into production-ready cinematic prompts and negative prompts.
   - **Step 3 (Characters & Mandatory Scenes)**:
     - Custom character image upload (*PNG, JPG, WebP*) with drag-and-drop support.
     - Mandatory Scene Assignment Grid: ensures every scene is locked to a specific character reference before proceeding.
     - Auto-match scenes based on character names mentioned in the script.
   - **Step 4 (Generate)**: Batch clip generation locked strictly to assigned character images with zero drift.
   - **Step 5 (Timeline & Clip Trimmer)**:
     - Interactive Story Player with Ken Burns pan & zoom, Web Speech voiceover, Web Audio synthesizer music, bouncing SFX badges, and animated subtitles.
     - Clip Trimmer: Natural language cutting (e.g., `remove from 1.1s to 1.6s`) or manual interval cutting.
   - **Step 6 (Export & Download)**:
     - Full Movie Video Compiler: Pure client-side HTML5 Canvas + Web Audio + `MediaRecorder` pipeline compiling all scenes into a single downloadable `.webm` movie file.
     - Project State JSON Import & Export for instant saving and restoring of complete story projects.

2. **Zero Backend Required**:
   - 100% Client-side. Runs on any static web server.
   - Project persistence via `localStorage` and optional Google Drive sync.

3. **Free & High-Performance AI**:
   - High-speed LLM scripting powered by **Groq** (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`).
   - Free AI visual generator fallback.
   - Optional Google AI Studio (Gemini / Veo 2) integration for video generation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML5, CSS3, ES6 JavaScript (zero build step) |
| **Typography** | Google Fonts (Outfit, Inter) & Tabler Icons |
| **Animation & Audio** | HTML5 Canvas, Web Audio API, Web Speech API (speechSynthesis) |
| **Video Compilation** | Pure client-side `MediaRecorder` + Canvas pipeline (`.webm`) |
| **AI Scripting** | Groq API (`llama-3.3-70b-versatile`) |
| **Hosting** | GitHub Pages |

---

## 📁 Repository Structure

```text
wise-simple-studio/
├── index.html         # Main application shell & Google Sign-In SDK bootstrap
├── app.js             # 7-step studio engine, timeline player & video compiler
├── styles.css         # Studio dark UI, responsive layout & animation styles
├── epic_state.json    # Pre-built 7-minute 12-scene demonstration project
├── assets/
│   ├── characters/    # Character sheets (e.g. Harry, Toby)
│   └── scenes/        # Scene visual stills (scene_1.jpg to scene_12.jpg)
└── README.md          # Project documentation and specifications
```

---

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/virendrakulkarni-design/wise-simple-studio.git
   cd wise-simple-studio
   ```

2. **Run locally**:
   ```bash
   # Using Python 3:
   python -m http.server 8085

   # Or using Node:
   npx serve .
   ```

3. **Launch the app**:
   Open `http://localhost:8085/index.html` in your browser.

4. **Instant Test**:
   Click **"🎬 Load 7-Min Kids Story"** to immediately test with 12 pre-rendered scenes, character art, and ready-to-play clips!

---

## 🌐 Deploy to GitHub Pages

1. In this repository, go to **Settings** → **Pages**.
2. Set source: **Deploy from a branch** → `main` → `/ (root)`.
3. Save. The live site updates automatically at `https://virendrakulkarni-design.github.io/wise-simple-studio/`.

---

## 📄 License

MIT License © 2026 Virendra Kulkarni
