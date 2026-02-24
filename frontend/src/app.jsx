import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState(null);
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://${window.location.hostname}:8000/ws/${userId}`);
    socket.onopen = () => console.log('WebSocket connected');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'assistant_response') {
        setMessages(prev => [...prev, { sender: 'assistant', text: data.text }]);
        // Play audio if available
        if (data.audio_url) {
          new Audio(data.audio_url).play();
        }
      }
    };
    setWs(socket);
    return () => socket.close();
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      setMessages(prev => [...prev, { sender: 'user', text: input }]);
      ws.send(JSON.stringify({ type: 'user_message', text: input }));
      setInput('');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>Eunoia</h1>
      <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        style={{ width: '80%', padding: '8px' }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
