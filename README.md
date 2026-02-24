# Eunoia Project

Eunoia is a conversational AI diary that provides emotional support through voice interaction. It features emotion detection, backchanneling, shared breath regulation, voice cloning for a "wise self" reflection, and proactive follow‑ups. The system uses a local LLM (Ollama) for conversation generation and Coqui TTS for natural voice output, all running on your own infrastructure.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [1. System Dependencies](#1-system-dependencies)
  - [2. Python 3.10 Environment](#2-python-310-environment)
  - [3. Python Packages](#3-python-packages)
  - [4. Ollama Model](#4-ollama-model)
  - [5. Frontend Setup (React + Vite + Tailwind v4)](#5-frontend-setup-react--vite--tailwind-v4)
- [Running the Application](#running-the-application)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Keeping Processes Alive with `tmux`](#keeping-processes-alive-with-tmux)
- [Features in Progress](#features-in-progress)
- [Troubleshooting](#troubleshooting)

---

## Project Structure

```
eunoia/
├── backend/                      # FastAPI backend
│   ├── app/                      # application code
│   │   ├── __init__.py
│   │   ├── connection_manager.py  # WebSocket connection manager
│   │   ├── llm_engine.py          # Ollama LLM wrapper
│   │   ├── main.py                 # FastAPI app with WebSocket and audio endpoints
│   │   └── tts_service.py          # Coqui TTS service
│   ├── audio/                     # generated audio files
│   │   └── generated/              # WAV files from TTS
│   ├── run.py                      # entry point for the backend
│   └── __init__.py
├── frontend/                      # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── App.jsx                 # main chat component
│   │   ├── index.css                # Tailwind v4 import
│   │   └── main.jsx                 # React entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js               # Vite config with Tailwind v4 plugin
│   └── ...
├── venv310/                        # Python virtual environment
└── README.md
```

---

## Prerequisites

- **Ubuntu 24.04** (or similar Linux distribution)
- **Python 3.10** (exactly, for package compatibility)
- **Node.js 20** (for frontend)
- At least **8 GB RAM** (recommended for running local LLMs)

---

## Setup Instructions

### 1. System Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ffmpeg portaudio19-dev
```

### 2. Python 3.10 Environment

Ubuntu 24.04 ships with Python 3.12 by default; we need 3.10.

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.10 python3.10-venv python3.10-dev

mkdir -p ~/eunoia
cd ~/eunoia
python3.10 -m venv venv310
source venv310/bin/activate
```

### 3. Python Packages

Install core dependencies. (OpenVoice is included for future voice cloning features; the basic TTS works without it.)

```bash
pip install --upgrade pip setuptools wheel
pip install git+https://github.com/myshell-ai/OpenVoice.git
pip install fastapi uvicorn websockets ollama TTS librosa scikit-learn transformers apscheduler python-dotenv
```

> **Note:** The first run of the backend will download TTS models (~1‑2 GB). Ensure a stable internet connection and sufficient disk space.

### 4. Ollama Model

Pull the default language model (llama3, ~4.7 GB). You may substitute a smaller model like `phi` if RAM is limited.

```bash
ollama pull llama3
```

(If `ollama` is not found, install it separately: `curl -fsSL https://ollama.com/install.sh | sh`.)

### 5. Frontend Setup (React + Vite + Tailwind v4)

We use **Tailwind CSS v4** with the official Vite plugin – no separate PostCSS config needed.

```bash
# Install Node.js 20 if not already present
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

cd ~/eunoia
npm create vite@latest frontend -- --template react
cd frontend
npm install axios lucide-react date-fns
npm install tailwindcss @tailwindcss/vite
```

Create/update `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```


(Remove any existing `tailwind.config.js` or `postcss.config.js` – they are not needed with v4.)

---

## Running the Application

You need two terminal sessions (or use `tmux`).

### Backend

From the project root (`~/eunoia`), activate the virtual environment and start the server:

```bash
source venv310/bin/activate
python -m backend.run
```

The backend will start on `http://0.0.0.0:8000`.  
On first run, TTS models will be downloaded automatically.

### Frontend

In a separate terminal:

```bash
cd ~/eunoia/frontend
npm run dev -- --host 0.0.0.0
```

The frontend will be available at `http://localhost:5173` and also on your VM’s public IP (e.g., `http://<your‑public‑ip>:5173`). Ensure ports `8000` and `5173` are open in your firewall/security group.



## Features in Progress

- [x] Core backend with WebSocket, LLM (Ollama), and TTS (Coqui)
- [x] Basic React frontend with chat interface
- [x] Tailwind CSS v4 integration
- [ ] Voice input (Web Speech API)
- [ ] Emotion detection (text‑based, then acoustic)
- [ ] Backchanneling (listening sounds)
- [ ] Shared breath regulation (stress‑triggered breath sounds)
- [ ] Wise self (voice cloning + rewriting)
- [ ] Conversation memory and diary summarisation
- [ ] Proactive follow‑up reminders

---

## Troubleshooting

- **TTS import errors**: If you encounter `ModuleNotFoundError: No module named 'pkg_resources'`, downgrade `setuptools` to `<81`:
  ```bash
  pip install "setuptools<81"
  ```
- **Ollama not found**: Install separately: `curl -fsSL https://ollama.com/install.sh | sh`
- **Port already in use**: Change the port in `backend/run.py` or kill the process using it.
- **Audio playback blocked**: Browsers may block autoplay. Click anywhere on the page before speaking, or use the "Play Last Audio" button.
- **WebSocket connection fails**:
  - Verify the backend is running and reachable on port 8000.
  - Check firewall rules (UFW) and security group settings.
  - Ensure CORS allows your frontend origin (the backend currently allows all origins for debugging).
- **Audio files not found (404)**:
  - The backend serves audio from `backend/audio/generated/`. Make sure the directory exists and is writable.
  - The audio endpoint uses an absolute path; if you moved the project, update `BASE_DIR` in `main.py`.

For more detailed instructions on each feature, refer to the project documentation or the conversation history with your team.

