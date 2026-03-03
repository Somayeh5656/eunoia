import requests
import json
import base64
import os
from typing import Optional

class EmotiVoiceClient:
    def __init__(self, api_url="http://localhost:8080"):
        self.api_url = api_url.rstrip('/')
        self.tts_url = f"{self.api_url}/tts"
        self.emotion_tts_url = f"{self.api_url}/tts-emotion"
        self.clone_url = f"{self.api_url}/clone-voice"
        
    def synthesize(self, text: str, speaker: str = "F7", 
                   emotion: str = "neutral", speed: float = 1.0) -> Optional[bytes]:
        """
        Synthesize speech with emotional control.
        
        Args:
            text: Text to synthesize
            speaker: Voice ID (F7 is expressive female, M3 is male, etc.)
            emotion: One of: neutral, happy, angry, sad, surprised, fearful
            speed: Speed factor (0.5-2.0)
        
        Returns:
            WAV audio bytes or None if failed
        """
        payload = {
            "text": text,
            "speaker": speaker,
            "emotion": emotion,
            "speed": speed
        }
        
        try:
            response = requests.post(
                self.emotion_tts_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                return response.content  # Raw WAV data
            else:
                print(f"EmotiVoice error: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"EmotiVoice request failed: {e}")
            return None
    
    def clone_voice(self, reference_audio_path: str, text: str) -> Optional[bytes]:
        """
        Zero-shot voice cloning: synthesize text in the voice from reference audio.
        Requires 3-10 seconds of clear WAV audio [citation:6].
        """
        with open(reference_audio_path, 'rb') as f:
            files = {'audio_file': ('reference.wav', f, 'audio/wav')}
            data = {'text': text}
            
            response = requests.post(self.clone_url, data=data, files=files)
            
            if response.status_code == 200:
                return response.content
            else:
                print(f"Clone failed: {response.text}")
                return None
    
    def get_speakers(self) -> list:
        """Get list of available speaker IDs"""
        try:
            response = requests.get(f"{self.api_url}/speakers")
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return ["F7", "M3", "C1"]  # fallback defaults [citation:8]