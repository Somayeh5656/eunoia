import os
import uuid
from TTS.api import TTS

class TTSService:
    def __init__(self, model_name="tts_models/en/ljspeech/tacotron2-DDC"):
        """
        Initialise the TTS service with the faster Tacotron2 model.
        This model provides a consistent female voice without emotion mapping.
        """
        self.tts = TTS(model_name)
        # Directories – computed relative to this file's location
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))  # ~/eunoia
        self.output_dir = os.path.join(base_dir, "backend", "audio", "generated")
        os.makedirs(self.output_dir, exist_ok=True)

    def synthesize(self, text: str, emotion: str = "neutral") -> str:
        """
        Generate speech using Tacotron2 + HiFi-GAN vocoder.
        The emotion parameter is accepted but ignored (kept for compatibility).
        """
        # Generate a unique filename
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(self.output_dir, filename)

        # Synthesise with Tacotron2 – much faster than XTTS
        self.tts.tts_to_file(
            text=text,
            file_path=filepath
        )

        return filepath