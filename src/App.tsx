import { useEffect, useState } from 'react'
import './App.css'
import { MicButton } from './components/MicButton'
import { ChatHistory } from './components/ChatHistory'
import { StatusBar } from './components/StatusBar'
import Settings from './components/Settings'
import { useClaudeApi } from './hooks/useClaudeApi'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis'

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  
  // API call via our local Go backend (no API key needed on frontend)
  const { sendMessage, isThinking, error } = useClaudeApi()
  
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    isSupported: speechSupported 
  } = useSpeechRecognition()

  const { speak, isSpeaking } = useSpeechSynthesis()

  // Handle final speech result
  useEffect(() => {
    if (!isListening && transcript) {
      handleUserMessage(transcript)
    }
  }, [isListening, transcript])

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return

    // Add user message
    const newHistory = [...history, { role: 'user' as const, content: text }]
    setHistory(newHistory)

    // Call API
    const response = await sendMessage(text, newHistory)
    
    if (response) {
      setHistory(prev => [...prev, { role: 'assistant' as const, content: response }])
      speak(response)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Pochi Web 🧸</h1>
        <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>⚙️</button>
      </header>

      <main className="main-content">
        <ChatHistory messages={history} />
        
        {error && <div className="error-banner">{error}</div>}
        
        <div className="mic-container">
          <MicButton 
            isListening={isListening} 
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            onPress={startListening}
            onRelease={stopListening}
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            isDisabled={!speechSupported || isThinking || isSpeaking}
          />
        </div>
        
        <StatusBar status={
          isListening ? 'listening' : 
          isThinking ? 'thinking' : 
          isSpeaking ? 'speaking' : 'idle'
        } />
      </main>

      {showSettings && (
        <div className="settings-modal">
          <Settings onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  )
}

export default App
