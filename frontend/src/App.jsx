import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState(null);
  const userIdRef = useRef('user_' + Math.random().toString(36).substr(2, 9));

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
          // Build absolute URL
          const fullAudioUrl = `http://86.50.20.198:8000${data.audio_url}`;
          console.log('Audio URL:', fullAudioUrl);
          setLastAudioUrl(fullAudioUrl);
          // Attempt autoplay (may be blocked)
          new Audio(fullAudioUrl).play().catch(e => console.log('Autoplay failed:', e));
        }
      }
    };

    return () => socket.close();
  }, []);

  const sendMessage = () => {
    console.log("Send button clicked. Input value:", input);
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
