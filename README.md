# Eunoia Project Setup Guide

This document provides step-by-step instructions to replicate the development environment for the **Eunoia** project on a fresh Ubuntu 24.04 VM (e.g., CSC Pouta instance). The setup includes Python 3.10, a virtual environment with all required Python packages (OpenVoice, FastAPI, etc.), Node.js 20, and a React frontend with Vite.

## Prerequisites

- Ubuntu 24.04 VM (or compatible)
- sudo access
- At least 8GB RAM (recommended for running local LLMs)

---

## 1. System Update & Basic Tools

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

---

## 2. Install Python 3.10

Ubuntu 24.04 comes with Python 3.12 by default, but we need Python 3.10 for compatibility. Use the deadsnakes PPA:

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.10 python3.10-venv python3.10-dev
```

Verify:

```bash
python3.10 --version
```

---

## 3. Install Node.js 20

The default Node.js version in Ubuntu is 18, but we need Node 20 for the frontend tools. Remove any existing Node.js and install from NodeSource:

```bash
sudo apt remove -y nodejs npm          # remove old versions if present
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node -v   # should be v20.x.x
npm -v    # should be 10.x.x
```

---

## 4. Install System Dependencies for Audio & Python Packages

```bash
sudo apt install -y ffmpeg portaudio19-dev
```

(OpenSMILE and other audio tools may be added later.)

---

## 5. Set Up Python Virtual Environment

Create a project directory and a virtual environment with Python 3.10:

```bash
mkdir -p ~/eunoia
cd ~/eunoia
python3.10 -m venv venv310
source venv310/bin/activate
```

---

## 6. Install Python Packages

First upgrade pip and setuptools:

```bash
pip install --upgrade pip setuptools wheel
```

Then install the required packages (including OpenVoice from GitHub):

```bash
pip install git+https://github.com/myshell-ai/OpenVoice.git
pip install fastapi uvicorn websockets ollama TTS librosa scikit-learn transformers apscheduler python-dotenv
```

> **Note:** Some packages may take a few minutes to compile. Ensure you have sufficient memory (if using a small VM, you might need to add swap).

---

## 7. Pull Ollama Model (Optional for Later)

Ollama is installed automatically with the Python package. Pull the default model (llama3):

```bash
ollama pull llama3
```

This will download the model (~4.7GB). You can use a smaller model like `phi` if memory is limited.

---

## 8. Frontend Setup

Create the React frontend using Vite:

```bash
cd ~/eunoia
npm create vite@latest frontend -- --template react
cd frontend
```

Install base dependencies:

```bash
npm install axios lucide-react date-fns
```

Install Tailwind CSS (version 3) for styling:

```bash
npm install -D tailwindcss@3 postcss@8 autoprefixer@10
npx tailwindcss init -p
```

Configure Tailwind by editing `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add the Tailwind directives to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 9. Verify Installation

- Python environment should be active and all packages importable.
- Node and npm are at correct versions.
- Frontend can be started with `npm run dev` (will run on port 5173).
- Backend can be started later with `python -m backend.run` (once the backend code is written).

---

## 10. Troubleshooting Tips

- **OpenVoice installation fails**: Ensure you have `cmake` and other build tools: `sudo apt install cmake`.
- **Memory issues**: If the VM runs out of RAM during package compilation, add a swap file:
  ```bash
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  ```
- **Port conflicts**: The backend runs on 8000, frontend on 5173. Make sure these ports are open in your firewall/security group.
- **Ollama not found**: If `ollama` command is not available, install it separately via `curl -fsSL https://ollama.com/install.sh | sh`.


