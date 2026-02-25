import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const userIdRef = useRef('user_' + Math.random().toString(36).substr(2, 9));
  const lastEmotionRef = useRef('neutral');
  const backchannelTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);           // hold the current recognition instance

  // --- Emotion detection (keyword based) ---
  const detectEmotion = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('stressed') || lower.includes('overwhelmed') || lower.includes('anxious')) return 'stressed';
    if (lower.includes('sad') || lower.includes('depressed') || lower.includes('cry') || lower.includes('lonely')) return 'sad';
    if (lower.includes('happy') || lower.includes('great') || lower.includes('wonderful') || lower.includes('excited')) return 'happy';
    if (lower.includes('angry') || lower.includes('mad') || lower.includes('frustrated')) return 'angry';
    if (lower.includes('surprised') || lower.includes('wow') || lower.includes('oh')) return 'surprised';
    if (lower.includes('interesting') || lower.includes('hmm') || lower.includes('think')) return 'interested';
    return 'neutral';
  };

  // --- Map emotions to sound files ---
  const emotionSoundMap = {
    stressed: 'critical.wav',
    sad: 'sad.wav',
    happy: 'delicious.wav',
    angry: 'angry.wav',
    surprised: 'surprised.wav',
    neutral: 'neutral_uhumm.wav',
  };

  const interestedSounds = ['interested1.wav', 'interested2.wav', 'interested3.wav', 'interested4.wav'];

  const playBackchannel = () => {
    const emotion = lastEmotionRef.current;
    let soundFile;
    if (emotion === 'interested') {
      const randomIndex = Math.floor(Math.random() * interestedSounds.length);
      soundFile = interestedSounds[randomIndex];
    } else {
      soundFile = emotionSoundMap[emotion] || 'neutral_uhumm.wav';
    }
    new Audio(`/sounds/${soundFile}`).play().catch(e => console.log('Backchannel play failed:', e));
  };

  // --- WebSocket setup (unchanged) ---
  useEffect(() => {
    const socket = new WebSocket(`ws://86.50.20.198:8000/ws/${userIdRef.current}`);
    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      setWs(socket);
    };
    socket.onclose = (event) => {
      console.log('❌ WebSocket disconnected', event.code, event.reason);
      setConnected(false);
    };
    socket.onerror = (err) => console.error('WebSocket error:', err);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'assistant_response') {
        setMessages(prev => [...prev, { sender: 'assistant', text: data.text }]);
        if (data.audio_url) {
          const fullAudioUrl = `http://86.50.20.198:8000${data.audio_url}`;
          console.log('Audio URL:', fullAudioUrl);
          setLastAudioUrl(fullAudioUrl);
          new Audio(fullAudioUrl).play().catch(e => console.log('Autoplay failed:', e));
        }
      }
    };
    return () => {
      socket.close();
      if (backchannelTimeoutRef.current) clearTimeout(backchannelTimeoutRef.current);
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not open');
      return;
    }
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    ws.send(JSON.stringify({ type: 'user_message', text: input }));
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const playLastAudio = () => {
    if (lastAudioUrl) {
      new Audio(lastAudioUrl).play().catch(e => console.log('Manual play failed:', e));
    }
  };

  // --- Push‑to‑talk: start listening on mouse down ---
  const startListening = (e) => {
    e.preventDefault();   // prevent any default button behaviour
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;          // stops when we call .stop()
    recognition.interimResults = false;      // we only want the final transcript
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => {
      setIsListening(false);
      // after stopping, schedule the backchannel sound
      if (backchannelTimeoutRef.current) clearTimeout(backchannelTimeoutRef.current);
      backchannelTimeoutRef.current = setTimeout(playBackchannel, 800);
      recognitionRef.current = null;
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      const emotion = detectEmotion(transcript);
      lastEmotionRef.current = emotion;
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // --- Stop listening on mouse up or mouse leave ---
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();    // this will trigger onend
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>Eunoia</h1>
      <div style={{ marginBottom: '10px' }}>
        Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: '10px' }}>
        {/* Push‑to‑talk button: hold to speak */}
        <button
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onMouseLeave={stopListening}   // if the mouse leaves while holding, stop
          disabled={!connected || isListening}
          style={{ marginRight: '8px', padding: '8px' }}
        >
          {isListening ? <MicOff /> : <Mic />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ flex: 1, padding: '8px' }}
          disabled={!connected}
        />
        <button onClick={sendMessage} disabled={!connected} style={{ padding: '8px 16px' }}>
          Send
        </button>
      </div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={playLastAudio} disabled={!lastAudioUrl}>
          Play Last Audio
        </button>
      </div>
    </div>
  );
}

export default App;