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
  const recognitionRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');        // store full transcript
  const isMouseDownRef = useRef(false);               // track if button is pressed

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
    neutral: 'hm_thinking.wav',
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

  const sendMessage = (textToSend = null) => {
    const messageText = textToSend !== null ? textToSend : input;
    if (!messageText.trim()) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not open');
      return;
    }
    setMessages(prev => [...prev, { sender: 'user', text: messageText }]);
    ws.send(JSON.stringify({ type: 'user_message', text: messageText }));
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
    e.preventDefault();
    if (isListening) return; // already listening

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    accumulatedTranscriptRef.current = '';
    isMouseDownRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;          // keep listening until we stop
    recognition.interimResults = true;       // we need to capture final parts
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        accumulatedTranscriptRef.current += finalTranscript;
        setInput(accumulatedTranscriptRef.current); // update input box in real time
        // Optionally detect emotion from the accumulated text, but for backchannel we'll use the last full sentence? For simplicity, we'll keep the last emotion from the latest final result.
        const emotion = detectEmotion(finalTranscript);
        lastEmotionRef.current = emotion;
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      // if error occurs while mouse is down, we might want to restart? For now just stop.
      if (isMouseDownRef.current) {
        // attempt to restart after a short delay
        setTimeout(() => {
          if (isMouseDownRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('Restart failed', e);
            }
          }
        }, 500);
      }
    };

    recognition.onend = () => {
      // Recognition ended (maybe because of pause, error, or we called stop())
      if (isMouseDownRef.current) {
        // If mouse is still down, restart recognition
        try {
          recognition.start();
        } catch (e) {
          console.log('Restart failed', e);
        }
      } else {
        // Mouse released, we are done
        setIsListening(false);
        recognitionRef.current = null;
        // Send the accumulated message
        if (accumulatedTranscriptRef.current.trim()) {
          sendMessage(accumulatedTranscriptRef.current);
        }
        // Schedule backchannel
        if (backchannelTimeoutRef.current) clearTimeout(backchannelTimeoutRef.current);
        backchannelTimeoutRef.current = setTimeout(playBackchannel, 800);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // --- Stop listening on mouse up or mouse leave ---
  const stopListening = () => {
    isMouseDownRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // this will trigger onend
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
          onMouseLeave={stopListening}
          disabled={!connected}
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