# Eunoia Project

Eunoia is a conversational AI diary that provides emotional support through voice interaction. It features emotion detection, emotion-aware speech synthesis (using EmotiVoice), backchanneling, shared breath regulation, and voice cloning for a "wise self" reflection. The system uses a cloud LLM (Groq) for fast conversation generation and EmotiVoice for expressive text-to-speech, all running on your own infrastructure.

---

# Table of Contents

* [Project Structure](#project-structure)
* [Prerequisites](#prerequisites)
* [Setup Instructions](#setup-instructions)

  * [1. System Dependencies](#1-system-dependencies)
  * [2. Python 3.10 Environment](#2-python-310-environment)
  * [3. Python Packages](#3-python-packages)
  * [4. Docker & EmotiVoice](#4-docker--emotivoice)
  * [5. Groq API Key](#5-groq-api-key)
  * [6. Frontend Setup (React + Vite + Tailwind v4)](#6-frontend-setup-react--vite--tailwind-v4)
* [Running the Application](#running-the-application)
* [Features](#features)
* [Troubleshooting](#troubleshooting)

---

# Project Structure

```text
eunoia/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── connection_manager.py
│   │   ├── llm_engine.py
│   │   ├── main.py
│   │   ├── emotion.py
│   │   ├── emotivoice_client.py
│   │   └── tts_service.py
│   ├── audio/
│   │   └── generated/
│   ├── run.py
│   └── __init__.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── venv310/
└── README.md
```

---

# Prerequisites

* Ubuntu 24.04 (or similar Linux distribution)
* Python 3.10
* Node.js 20
* Docker
* Minimum 8 GB RAM (recommended)

---

# Setup Instructions

## 1. System Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ffmpeg portaudio19-dev
```

---

## 2. Python 3.10 Environment

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.10 python3.10-venv python3.10-dev

mkdir -p ~/eunoia
cd ~/eunoia

python3.10 -m venv venv310
source venv310/bin/activate
```

---

## 3. Python Packages

```bash
pip install --upgrade pip setuptools wheel

pip install git+https://github.com/myshell-ai/OpenVoice.git

pip install \
fastapi \
uvicorn \
websockets \
TTS \
librosa \
scikit-learn \
transformers \
apscheduler \
python-dotenv \
requests \
groq
```

The project uses **Groq** for LLM inference. Ollama is no longer required.

---

## 4. Docker & EmotiVoice

Install Docker:

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | \
sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt update

sudo apt install -y docker-ce docker-ce-cli containerd.io

sudo usermod -aG docker $USER
newgrp docker
```

Pull and run EmotiVoice:

```bash
docker pull syq163/emoti-voice:latest

docker run -d \
--name emotivoice \
-p 8501:8501 \
-p 8001:8000 \
-e DEVICE=cpu \
syq163/emoti-voice:latest
```

Verify:

```bash
docker ps

curl http://localhost:8001/v1/audio/speech
```

A **405 Method Not Allowed** response indicates the API is running correctly.

---

## 5. Groq API Key

Create a `.env` file:

```bash
echo "GROQ_API_KEY=your_api_key_here" > .env
```

---

## 6. Frontend Setup

Create the React app:

```bash
npm create vite@latest frontend -- --template react

cd frontend

npm install

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
  server: {
    host: '0.0.0.0'
  }
})
```

Replace `src/index.css` with:

```css
@import "tailwindcss";
```

---

# Running the Application

Three services are required.

## 1. Start EmotiVoice

```bash
docker start emotivoice
```

---

## 2. Backend

```bash
cd ~/eunoia

source venv310/bin/activate

python -m backend.run
```

Backend:

```
http://0.0.0.0:8000
```

---

## 3. Frontend

```bash
cd ~/eunoia/frontend

npm run dev -- --host 0.0.0.0
```

Frontend:

```
http://localhost:5173
```

---

## Optional: Run Everything with tmux

Backend:

```bash
tmux new -s backend
```

Frontend:

```bash
tmux new -s frontend
```

EmotiVoice:

```bash
tmux new -s emotivoice
```

Detach:

```
Ctrl + B
D
```

Reconnect:

```bash
tmux attach -t backend
tmux attach -t frontend
tmux attach -t emotivoice
```

---

# Features

* ✅ FastAPI backend
* ✅ WebSocket communication
* ✅ Groq LLM integration
* ✅ EmotiVoice text-to-speech
* ✅ Emotion detection
* ✅ Emotion-aware speech synthesis
* ✅ Push-to-talk React frontend
* ✅ Ambient café sound while waiting
* ⏳ Backchannel responses
* ⏳ Shared breathing exercises
* ⏳ Wise-self voice cloning
* ⏳ Diary summarisation

---

# Troubleshooting

### EmotiVoice won't start

```bash
docker logs emotivoice
```

---

### Verify EmotiVoice API

```bash
curl http://localhost:8001/v1/audio/speech
```

Expected response:

```
405 Method Not Allowed
```

---

### WebSocket won't connect

* Backend must be running on port **8000**
* Ensure firewall allows ports:

```
8000
5173
8001
8501
```

---

### Audio doesn't play

Modern browsers block autoplay.

Click anywhere on the page before speaking.

---

### Slow speech generation

CPU inference is slower and may take several seconds.

For GPU acceleration:

```bash
docker run --gpus all ...
```

---

### Groq API errors

Verify that your `.env` file contains:

```text
GROQ_API_KEY=your_api_key_here
```

---

# Git Commands

Push changes:

```bash
git add .
git commit -m "Update project"
git push
```

Pull latest changes:

```bash
git pull
```
