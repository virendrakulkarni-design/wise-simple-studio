# Wise Simple Studio

> **AI Video & Animated Story Creator** — Fast, client-side, 7-step storytelling and video animation pipeline.

Wise Simple Studio is an independent, streamlined application dedicated exclusively to generating animated stories, video scripts, custom character art, video clips, and full movie compilations.

---

## 🌟 Key Features

1. **7-Step End-to-End Pipeline**:
   - **Step 0 (Concept)**: Choose visual styles (Kids 3D Animation, Cinematic Live Action, Anime Storybook, Sci-Fi, Claymation, Vintage 1960s), target duration (15s up to 7-Minute Kids Epics), and aspect ratio (16:9, 9:16, 1:1).
   - **Step 1 (Script)**: Scene-by-scene script generator with character descriptions, environment, mood, lighting, camera angles, lively narration, humorous dialogue, and sound effect cues.
   - **Step 2 (Prompts)**: Expands each scene into production-ready cinematic prompts and negative prompts.
   - **Step 3 (Characters & Mandatory Scenes)**:
     - Custom character image upload (PNG, JPG, WebP) with drag-and-drop support.
     - Mandatory Scene Assignment Grid: ensures every scene is assigned a character image before proceeding.
     - Auto-match scenes based on character names in scene text.
   - **Step 4 (Generate)**: Batch clip generation strictly locked to assigned character images with zero drift.
   - **Step 5 (Timeline & Clip Trimmer)**:
     - Interactive Story Player with Ken Burns pan & zoom, Web Speech voiceover, Web Audio synthesizer music, bouncing SFX badges, and animated subtitles.
     - Clip Trimmer: Natural language cutting (e.g. `remove from 1.1s to 1.6s`) or manual time interval cutting.
   - **Step 6 (Export & Download)**:
     - Full Movie Video Compiler: Pure client-side Canvas + Web Audio + `MediaRecorder` pipeline compiling all scenes into a single downloadable `.webm` movie file.
     - Project JSON Import and Export.

2. **Zero Backend Required**:
   - 100% Client-side. Runs on any static web server (GitHub Pages, local HTTP server, Netlify, Vercel).
   - Local persistence via `localStorage`.

3. **Free & High-Performance AI**:
   - High-speed LLM scripting powered by **Groq** (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`).
   - Free AI visual generator fallback (no API key required).
   - Optional Google AI Studio (Gemini / Veo 2) integration for video generation.

---

## 🚀 Getting Started

1. Clone or navigate to the repository:
   ```bash
   cd wise-simple-studio
   ```

2. Start any local web server:
   ```bash
   # Using Python 3:
   python -m http.server 8085

   # Or using Node:
   npx serve .
   ```

3. Open your browser at:
   `http://localhost:8085/index.html`

4. Click **"🎬 Load 7-Min Kids Story"** to immediately test with 12 scenes, character art, and ready-to-play clips!

---

## 📄 License
MIT License
