import { useEffect, useRef } from 'react'
import { Message } from '../hooks/useClaudeApi'

interface ChatHistoryProps {
  messages: Message[]
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="chat-history chat-history--empty">
        <div className="chat-empty-hint">
          <span className="chat-empty-bear">🧸</span>
          <p>マイクボタンを押して話しかけてね</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-history">
      {messages.map((msg, i) => (
        <div key={i} className={`chat-message chat-message--${msg.role}`}>
          {msg.role === 'assistant' && <span className="chat-avatar">🧸</span>}
          <div className="chat-bubble">{msg.content}</div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
