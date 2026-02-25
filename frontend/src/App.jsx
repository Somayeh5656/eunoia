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

  // Backchannel sounds
  const backchannelSounds = [
    'hm_angry.wav',
    'hm_male.wav',
    'hm_thinking.wav',
    'hmm_various-3.wav',
    'hmm-various-8.wav'
  ];
  const backchannelTimeoutRef = useRef(null);

  const playRandomBackchannel = () => {
    const random = backchannelSounds[Math.floor(Math.random() * backchannelSounds.length)];
    new Audio(`/sounds/${random}`).play().catch(e => console.log('Backchannel play failed:', e));
  };

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

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

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

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      if (backchannelTimeoutRef.current) clearTimeout(backchannelTimeoutRef.current);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Schedule a backchannel sound after a short pause
      if (backchannelTimeoutRef.current) clearTimeout(backchannelTimeoutRef.current);
      backchannelTimeoutRef.current = setTimeout(playRandomBackchannel, 800);
    };

    recognition.onresult = (event) => {
      if (backchannelTimeoutRef.current) clearTimeout(backchannelTimeoutRef.current);
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(); // Send immediately – backchannel will play after the assistant's reply starts
    };

    recognition.start();
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
        <button onClick={handleVoiceInput} disabled={!connected} style={{ marginRight: '8px', padding: '8px' }}>
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