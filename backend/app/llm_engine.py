import os
import asyncio
from groq import Groq
from typing import List, Dict
from dotenv import load_dotenv
load_dotenv()

class LLMEngine:
    def __init__(self, user_id: str, model="llama3-8b-8192"):
        self.user_id = user_id
        self.model = model
        # Use API key from environment variable (recommended) or hardcode for testing
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        self.system_prompt = """You are Eunoia, a warm, empathetic AI diary companion.
Your role is to listen, comfort, and gently support the user's emotional well-being.
You have access to the user's conversation history and current emotion (detected from voice).

Important guidelines:
- Be concise but caring. Keep responses to 1-3 sentences unless the user asks for more.
- If the user is distressed, offer comfort and suggest gentle actions (e.g., breathing, reflection).
- If appropriate, you can ask if they'd like to hear a "wise self" reflection (using their own voice).
- Never be clinical; always sound like a caring friend.
- If the user's message is unclear or you don't understand, politely ask for clarification.
- If the user talks about something outside your scope (e.g., technical questions), gently guide back to emotional topics.
- Acknowledge corrections gracefully: if the user corrects themselves, respond with understanding.
- Always maintain a warm, supportive tone.
"""
        self.conversation_history = []  # list of {"role": "user"/"assistant", "content": ...}
    
    def add_message(self, role: str, content: str):
        self.conversation_history.append({"role": role, "content": content})
        if len(self.conversation_history) > 10:
            self.conversation_history = self.conversation_history[-10:]
    
    async def generate_response(self, user_input: str, emotion: str = "neutral") -> str:
        messages = [{"role": "system", "content": self.system_prompt}]
        messages.extend(self.conversation_history[-6:])
        messages.append({"role": "user", "content": f"[Emotion: {emotion}] {user_input}"})
        
        # Run the synchronous Groq call in a thread to avoid blocking the async event loop
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=500
        ))
        reply = response.choices[0].message.content
        
        self.add_message("user", user_input)
        self.add_message("assistant", reply)
        return reply
