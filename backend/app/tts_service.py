import os
import uuid
from TTS.api import TTS

class TTSService:
    def __init__(self, model_name="tts_models/multilingual/multi-dataset/xtts_v2"):
        """
        Initialise the TTS service with the XTTS model.
        """
        self.tts = TTS(model_name)
        # Directories – computed relative to this file's location
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))  # ~/eunoia
        self.output_dir = os.path.join(base_dir, "backend", "audio", "generated")
        self.reference_dir = os.path.join(base_dir, "backend", "audio", "reference")
        os.makedirs(self.output_dir, exist_ok=True)

        # Map emotions to reference filenames (you can change these to your actual file names)
        self.emotion_to_file = {
            'neutral': 'neutral.wav',
            'happy': 'happy.wav',
            'sad': 'sad.wav',
            'angry': 'angry.wav',
            'calm': 'calm.wav',          # optional
            'fearful': 'fearful.wav',     # optional
            'stressed': 'fearful.wav',    # fallback – use fearful for stressed
        }

        # Verify that at least the neutral reference exists
        neutral_path = os.path.join(self.reference_dir, self.emotion_to_file['neutral'])
        if not os.path.exists(neutral_path):
            raise FileNotFoundError(
                f"Neutral reference file not found at {neutral_path}. "
                "Please place a neutral reference file in the reference directory."
            )

    def synthesize(self, text: str, emotion: str = "neutral") -> str:
        """
        Generate speech with emotional prosody by transferring style from a reference audio file.

        Args:
            text: The text to be spoken.
            emotion: Detected emotion (e.g., 'happy', 'sad', 'stressed').

        Returns:
            Path to the generated audio file.
        """
        # Determine reference file for the given emotion, fallback to neutral if missing
        ref_file = self.emotion_to_file.get(emotion, self.emotion_to_file['neutral'])
        ref_path = os.path.join(self.reference_dir, ref_file)

        # If the specific emotion reference doesn't exist, fall back to neutral
        if not os.path.exists(ref_path):
            print(f"Warning: reference file for '{emotion}' not found at {ref_path}. Using neutral.")
            ref_path = os.path.join(self.reference_dir, self.emotion_to_file['neutral'])

        # Generate a unique filename
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(self.output_dir, filename)

        # Synthesise with XTTS – the magic happens here
        self.tts.tts_to_file(
            text=text,
            speaker_wav=ref_path,   # transfer style from this recording
            language="en",
            file_path=filepath
        )

        return filepath