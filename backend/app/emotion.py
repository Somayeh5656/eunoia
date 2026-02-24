def detect_emotion(text: str) -> str:
    text_lower = text.lower()
    if any(word in text_lower for word in ['stressed', 'overwhelmed', 'anxious', 'panic', 'worried']):
        return 'stressed'
    elif any(word in text_lower for word in ['sad', 'depressed', 'unhappy', 'cry', 'lonely']):
        return 'sad'
    elif any(word in text_lower for word in ['happy', 'great', 'wonderful', 'excited', 'love']):
        return 'happy'
    else:
        return 'neutral'