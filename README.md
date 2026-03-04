# Updated README.md

```markdown
# Eunoia Project

Eunoia is a conversational AI diary that provides emotional support through voice interaction. It features emotion detection, emotion‑aware speech synthesis (using EmotiVoice), backchanneling, shared breath regulation, and voice cloning for a "wise self" reflection. The system uses a cloud LLM (Groq) for fast conversation generation and EmotiVoice for expressive TTS, all running on your own infrastructure.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [1. System Dependencies](#1-system-dependencies)
  - [2. Python 3.10 Environment](#2-python-310-environment)
  - [3. Python Packages](#3-python-packages)
  - [4. Docker & EmotiVoice](#4-docker--emotivoice)
  - [5. Groq API Key](#5-groq-api-key)
  - [6. Frontend Setup (React + Vite + Tailwind v4)](#6-frontend-setup-react--vite--tailwind-v4)
- [Running the Application](#running-the-application)
  - [Start EmotiVoice Container](#start-emotivoice-container)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Keeping Processes Alive with `tmux`](#keeping-processes-alive-with-tmux)
- [Features Implemented](#features-implemented)
- [Troubleshooting](#troubleshooting)

---

## Project Structure

```
eunoia/
├── backend/                      # FastAPI backend
│   ├── app/                      # application code
│   │   ├── __init__.py
│   │   ├── connection_manager.py  # WebSocket connection manager
│   │   ├── llm_engine.py          # Groq LLM wrapper
│   │   ├── main.py                # FastAPI app with WebSocket and audio endpoints
│   │   ├── emotion.py              # keyword‑based emotion detection
│   │   ├── emotivoice_client.py    # client for EmotiVoice API
│   │   └── tts_service.py          # unified TTS service (uses EmotiVoice)
│   ├── audio/                     # generated audio files
│   │   └── generated/              # WAV files from TTS
│   ├── run.py                      # entry point for the backend
│   └── __init__.py
├── frontend/                      # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── App.jsx                 # main chat component (push‑to‑talk)
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
- **Docker** (for running EmotiVoice container)
- At least **8 GB RAM** (recommended for running EmotiVoice on CPU)

---

## Setup Instructions

### 1. System Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ffmpeg portaudio19-dev
```

### 2. Python 3.10 Environment

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

```bash
pip install --upgrade pip setuptools wheel
pip install git+https://github.com/myshell-ai/OpenVoice.git
pip install fastapi uvicorn websockets TTS librosa scikit-learn transformers apscheduler python-dotenv requests groq
```

(We no longer use Ollama; Groq is used via API.)

### 4. Docker & EmotiVoice

Install Docker (if not already):

```bash
# Add Docker's official GPG key and repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER
newgrp docker
```

Pull and run the EmotiVoice container (CPU mode):

```bash
docker pull syq163/emoti-voice:latest
docker run -d \
  --name emotivoice \
  -p 8501:8501 \
  -p 8001:8000 \
  -e DEVICE=cpu \
  syq163/emoti-voice:latest
```

- Port `8501` serves the web UI (http://86.50.20.198:8501)
- Port `8001` is the HTTP API (used by our backend)

Verify it's running:

```bash
docker ps
curl http://localhost:8001/v1/audio/speech   # should return 405 (Method Not Allowed) – good
```

### 5. Groq API Key

Create a `.env` file in the project root:

```bash
echo "GROQ_API_KEY=your_key_here" > ~/eunoia/.env
```

(Get a free key from [console.groq.com](https://console.groq.com))

### 6. Frontend Setup (React + Vite + Tailwind v4)

```bash
cd ~/eunoia
npm create vite@latest frontend -- --template react
cd frontend
npm install axios lucide-react date-fns
npm install tailwindcss @tailwindcss/vite
```

Create `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0' }
})
```

Replace `src/index.css` with:

```css
@import "tailwindcss";
```

(Remove any existing `tailwind.config.js` or `postcss.config.js` – not needed.)

The frontend code is already in `src/App.jsx` (push‑to‑talk with cafe sound, etc.).

---

## Running the Application

You need three terminal sessions (or use `tmux`).

### Start EmotiVoice Container

```bash
docker start emotivoice   # if stopped, or run the docker run command from above
```

### Backend

```bash
cd ~/eunoia
source venv310/bin/activate
python -m backend.run
```

The backend will start on `http://0.0.0.0:8000`. It connects to EmotiVoice on port 8001 and Groq via API key.

### Frontend

```bash
cd ~/eunoia/frontend
npm run dev -- --host 0.0.0.0
```

Access the frontend at `http://86.50.20.198:5173`.

### Keeping Processes Alive with `tmux`

```bash
# Start tmux sessions
tmux new -s emotivoice   # inside: docker start emotivoice && docker logs -f emotivoice
tmux new -s backend      # inside: cd ~/eunoia && source venv310/bin/activate && python -m backend.run
tmux new -s frontend     # inside: cd ~/eunoia/frontend && npm run dev -- --host 0.0.0.0
```

Detach with `Ctrl+B, D`, reattach later with `tmux attach -t <session>`.

---

## Features Implemented

- [x] Core backend with WebSocket, LLM (Groq), and emotion‑aware TTS (EmotiVoice)
- [x] Basic React frontend with push‑to‑talk microphone
- [x] Cafe ambiance sound while waiting for assistant response
- [x] Emotion detection (text‑based keywords)
- [x] Emotion‑aware speech synthesis (voice changes with emotion)
- [ ] Backchanneling (listening sounds) – optional
- [ ] Shared breath regulation – optional
- [ ] Wise self (voice cloning) – optional
- [ ] Diary summarisation & proactive follow‑up – optional

---

## Troubleshooting

- **EmotiVoice container fails to start**: Check logs with `docker logs emotivoice`. Ensure ports 8501/8001 are free.
- **TTS errors**: Verify EmotiVoice is running (`curl http://localhost:8001/v1/audio/speech`). If it returns 405, the API is up; if 404 or connection refused, check container.
- **Audio playback blocked**: Browsers may block autoplay. Click anywhere on the page before speaking, or use the "Play Last Audio" button.
- **WebSocket connection fails**:
  - Backend must be running on port 8000.
  - Check firewall rules (UFW) and CSC security group for ports 8000, 5173, 8501, 8001.
- **Slow TTS**: EmotiVoice on CPU takes several seconds per sentence – this is expected. For faster generation, consider GPU (add `--gpus all` and remove `-e DEVICE=cpu`).
- **Groq API errors**: Ensure `.env` file exists and contains a valid API key.

For more detailed instructions on each feature, refer to the project documentation or the conversation history with your team.
```

git add .
git commit -m "gd"
git push

git pull