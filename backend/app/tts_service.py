from .emotivoice_client import EmotiVoiceClient

class TTSService:
    def __init__(self):
        self.client = EmotiVoiceClient()

    def synthesize(self, text: str, emotion: str = "neutral") -> str:
        return self.client.synthesize(text, emotion)