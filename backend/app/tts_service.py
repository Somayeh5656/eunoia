from TTS.api import TTS
import uuid
import os

class TTSService:
    def __init__(self, model_name="tts_models/en/ljspeech/tacotron2-DDC"):
        self.tts = TTS(model_name)
        self.output_dir = "backend/audio/generated"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def synthesize(self, text: str) -> str:
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(self.output_dir, filename)
        self.tts.tts_to_file(text=text, file_path=filepath)
        return filepath

