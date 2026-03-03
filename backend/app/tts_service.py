from TTS.api import TTS
import uuid
import os

class TTSService:
    def __init__(self, model_name="tts_models/multilingual/multi-dataset/xtts_v2"):
        self.tts = TTS(model_name)
        self.output_dir = "backend/audio/generated"
        os.makedirs(self.output_dir, exist_ok=True)
        # Optional: load a reference speaker for emotion (see below)

    def synthesize(self, text: str, emotion: str = "neutral") -> str:
        """
        Synthesize speech with emotion.
        emotion can be: 'neutral', 'happy', 'sad', 'angry', etc.
        """
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(self.output_dir, filename)

        # Map emotion to a speaker reference (you can prepare .wav files for each emotion)
        # If you have pre‑recorded voice samples that express each emotion, use them.
        # Otherwise, XTTS can also use a single reference and adjust via conditioning.
        emotion_wav_map = {
            'neutral': 'reference/neutral.wav',
            'happy': 'reference/happy.wav',
            'sad': 'reference/sad.wav',
            'stressed': 'reference/stressed.wav',
            'angry': 'reference/angry.wav',
        }

        # Use the reference file if available, otherwise fallback to neutral
        speaker_wav = emotion_wav_map.get(emotion, emotion_wav_map['neutral'])

        # XTTS requires a speaker reference and language
        self.tts.tts_to_file(
            text=text,
            speaker_wav=speaker_wav,
            language="en",
            file_path=filepath
        )
        return filepath