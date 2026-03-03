import os
import uuid
from .emotivoice_client import EmotiVoiceClient

class TTSService:
    def __init__(self, api_url="http://localhost:8080"):
        """
        Initialize EmotiVoice TTS service.
        """
        self.client = EmotiVoiceClient(api_url)
        self.output_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "backend", "audio", "generated"
        )
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Map your emotion detection to EmotiVoice emotions
        self.emotion_map = {
            'neutral': 'neutral',
            'happy': 'happy',
            'sad': 'sad',
            'angry': 'angry',
            'stressed': 'fearful',  # or 'angry' depending on context
            'surprised': 'surprised',
            'fearful': 'fearful',
            'calm': 'neutral',       # calm falls back to neutral
        }
        
        # Choose a speaker voice (F7 is very expressive)
        self.default_speaker = "F7"
    
    def synthesize(self, text: str, emotion: str = "neutral") -> str:
        """
        Generate speech using EmotiVoice with emotional control.
        
        Args:
            text: Text to synthesize
            emotion: Detected emotion from your app
        
        Returns:
            Path to generated audio file
        """
        # Map emotion to EmotiVoice's emotion labels
        emotivoice_emotion = self.emotion_map.get(emotion, 'neutral')
        
        # Generate audio
        audio_data = self.client.synthesize(
            text=text,
            speaker=self.default_speaker,
            emotion=emotivoice_emotion,
            speed=1.0
        )
        
        if audio_data is None:
            # Fallback: use neutral if emotion synthesis fails
            audio_data = self.client.synthesize(
                text=text,
                speaker=self.default_speaker,
                emotion='neutral'
            )
        
        if audio_data is None:
            raise RuntimeError("EmotiVoice synthesis failed")
        
        # Save to file
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(self.output_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(audio_data)
        
        return filepath