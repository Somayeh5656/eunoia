import requests
import os
import uuid
from typing import Optional

class EmotiVoiceClient:
    def __init__(self, api_url="http://localhost:8001"):
        self.api_url = api_url.rstrip('/')
        self.tts_endpoint = f"{self.api_url}/v1/audio/speech"
        self.output_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "backend", "audio", "generated"
        )
        os.makedirs(self.output_dir, exist_ok=True)

        # Map your emotion names to EmotiVoice prompt strings
        self.emotion_prompts = {
    'neutral': 'natural speech, conversational',
    'happy': 'very joyful, high pitch, energetic',
    'sad': 'depressed, slow, low energy, whispering, crying, sad',
    'angry': 'shouting, aggressive, fast',
    'stressed': 'nervous, stuttering, fast breathing',
    }


        # You can obtain a list of available voices from the web UI or API
        self.default_voice = "8051"  # one of the many voices

    def synthesize(self, text: str, emotion: str = "neutral", voice: Optional[str] = None) -> str:
        """
        Generate speech using EmotiVoice.
        Returns the file path of the generated audio.
        """
        # Use default voice if none provided
        voice = voice or self.default_voice

        # Map emotion to a prompt string
        prompt = self.emotion_prompts.get(emotion, 'neutral')

        payload = {
            "model": "emotivice",
            "input": text,
            "voice": voice,
            "prompt": prompt,
            "speed": 1.15
        }

        try:
            response = requests.post(
                self.tts_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60  # TTS can take several seconds
            )
            response.raise_for_status()
        except Exception as e:
            print(f"EmotiVoice request failed: {e}")
            raise RuntimeError(f"TTS synthesis failed: {e}")

        # Save audio to file
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(self.output_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(response.content)

        return filepath