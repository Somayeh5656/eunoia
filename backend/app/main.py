from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import json
import os
import uuid
from datetime import datetime

# Import your modules (we'll create them next)
from .llm_engine import LLMEngine
from .tts_service import TTSService
from .connection_manager import manager

app = FastAPI(title="Eunoia Backend")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services
llm_engines = {}  # user_id -> LLMEngine
tts = TTSService()

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
                # Placeholder emotion – we'll replace with real detection later
                emotion = "neutral"
                reply = await llm.generate_response(user_text, emotion)
                # Generate audio
                audio_file = tts.synthesize(reply)
                audio_url = f"/audio/{os.path.basename(audio_file)}"
                await websocket.send_text(json.dumps({
                    "type": "assistant_response",
                    "text": reply,
                    "audio_url": audio_url,
                    "timestamp": datetime.now().isoformat()
                }))
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    return FileResponse(f"backend/audio/generated/{filename}")
