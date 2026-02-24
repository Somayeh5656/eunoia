from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import json
import os
import uuid
from datetime import datetime
from .emotion import detect_emotion

from .llm_engine import LLMEngine
from .tts_service import TTSService
from .connection_manager import manager

app = FastAPI(title="Eunoia Backend")

# CORS – allow all origins for debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services
llm_engines = {}  # user_id -> LLMEngine
tts = TTSService()

# Base directory: project root (/home/ubuntu/eunoia)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@app.get("/")
async def root():
    return {"message": "Eunoia backend running"}

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    if user_id not in llm_engines:
        llm_engines[user_id] = LLMEngine(user_id=user_id)
    llm = llm_engines[user_id]

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message["type"] == "user_message":
                user_text = message["text"]
                emotion = detect_emotion(user_text)
                try:
                    reply = await llm.generate_response(user_text, emotion)
                except Exception as e:
                    print(f"LLM error: {e}")
                    reply = "I'm having trouble thinking right now. Please try again."
                    audio_url = None
                else:
                    try:
                        audio_file = tts.synthesize(reply)
                        audio_url = f"/audio/{os.path.basename(audio_file)}"
                    except Exception as e:
                        print(f"TTS error: {e}")
                        audio_url = None
                await websocket.send_text(json.dumps({
                    "type": "assistant_response",
                    "text": reply,
                    "audio_url": audio_url,
                    "timestamp": datetime.now().isoformat()
                }))
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"Unexpected WebSocket error: {e}")
        await websocket.close()

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    file_path = os.path.join(BASE_DIR, "backend", "audio", "generated", filename)
    return FileResponse(file_path)
