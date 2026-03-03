import os
import uuid
from TTS.api import TTS
import numpy as np
from scipy.io import wavfile
import soundfile as sf
import librosa

class TTSService:
    def __init__(self, model_name="tts_models/en/ljspeech/tacotron2-DDC"):
        """
        Initialise the TTS service with Tacotron2 (faster) and simulate emotion
        by adjusting speed and pitch.
        """
        self.tts = TTS(model_name)
        # Directories – computed relative to this file's location
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))  # ~/eunoia
        self.output_dir = os.path.join(base_dir, "backend", "audio", "generated")
        os.makedirs(self.output_dir, exist_ok=True)

        # Emotion to speed/pitch mapping
        # speed > 1.0 = faster, < 1.0 = slower
        # pitch_shift in semitones (positive = higher, negative = lower)
        self.emotion_params = {
            'neutral': {'speed': 1.0, 'pitch_shift': 0},
            'happy': {'speed': 1.15, 'pitch_shift': 2},      # faster, higher pitch
            'sad': {'speed': 0.85, 'pitch_shift': -2},       # slower, lower pitch
            'angry': {'speed': 1.2, 'pitch_shift': 1},        # faster, slightly higher
            'stressed': {'speed': 1.1, 'pitch_shift': 1},     # slightly faster, higher
            'calm': {'speed': 0.9, 'pitch_shift': -1},        # slower, slightly lower
            'fearful': {'speed': 1.1, 'pitch_shift': 2},      # faster, higher
            'surprised': {'speed': 1.2, 'pitch_shift': 3},    # fast, high pitch
            'interested': {'speed': 1.05, 'pitch_shift': 1},  # slightly faster
        }

    def synthesize(self, text: str, emotion: str = "neutral") -> str:
        """
        Generate speech with Tacotron2, then modify speed and pitch based on emotion.
        """
        # Get emotion parameters (default to neutral if emotion not found)
        params = self.emotion_params.get(emotion, self.emotion_params['neutral'])
        speed = params['speed']
        pitch_shift = params['pitch_shift']

        # Generate neutral audio with Tacotron2
        temp_file = os.path.join(self.output_dir, f"temp_{uuid.uuid4()}.wav")
        self.tts.tts_to_file(text=text, file_path=temp_file)

        # If no modification needed, just rename and return
        if speed == 1.0 and pitch_shift == 0:
            final_file = os.path.join(self.output_dir, f"{uuid.uuid4()}.wav")
            os.rename(temp_file, final_file)
            return final_file

        # Load audio with librosa
        y, sr = librosa.load(temp_file, sr=None)

        # 1. Adjust speed (time stretching)
        if speed != 1.0:
            y = librosa.effects.time_stretch(y, rate=speed)

        # 2. Adjust pitch
        if pitch_shift != 0:
            y = librosa.effects.pitch_shift(y, sr=sr, n_steps=pitch_shift)

        # Save modified audio
        final_file = os.path.join(self.output_dir, f"{uuid.uuid4()}.wav")
        sf.write(final_file, y, sr)

        # Clean up temp file
        os.remove(temp_file)

        return final_file