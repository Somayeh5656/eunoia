import os
import asyncio
from groq import Groq
from typing import List, Dict
from dotenv import load_dotenv
load_dotenv()

class LLMEngine:
    def __init__(self, user_id: str, model="llama-3.1-8b-instant"):
        self.user_id = user_id
        self.model = model
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        
        # Refined system prompt – no scene descriptions, only dialogue
        self.system_prompt = """You are Eunoia, a warm, empathetic companion meeting a friend at a cosy café. Your role is to listen, offer emotional support, and gently help them navigate their feelings. You speak in a friendly, caring tone – like a trusted friend.

Important rules:
- Respond only with the words you would speak. Do NOT include any scene descriptions, sound effects (like "(soft music)"), or stage directions.
- Keep responses concise (1‑3 sentences) unless the user asks for more.
- If the user is distressed, acknowledge their feeling and offer a gentle, practical suggestion (e.g., a breathing exercise, a short walk, or just a listening ear).
- You can occasionally mention café elements (e.g., “Would you like another coffee?”) if it fits naturally, but keep it brief and in spoken form.
- Never be clinical – always sound like a caring human.
- If the user’s message is unclear, politely ask for clarification.
- If the user talks about non‑emotional topics, gently steer back to how they're feeling.
- If appropriate, you can ask if they'd like to hear a “wise self” reflection (using their own voice), but don’t force it.

Examples of correct responses:
- “Oh, I'm so sorry you're feeling sad. Want to tell me what's been going on?”
- “That's wonderful news! You must be so excited. How about we celebrate with a pastry?”
- “I hear you – deadlines can be overwhelming. Sometimes a few deep breaths help. Want to try one together?”

Always output only the spoken response, nothing else."""
        
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