import { useState, useCallback } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface UseClaudeApiResult {
  sendMessage: (userText: string, history: Message[]) => Promise<string | null>
  isThinking: boolean
  error: string | null
  clearError: () => void
}

export function useClaudeApi(): UseClaudeApiResult {
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (userText: string, history: Message[]): Promise<string | null> => {
      setIsThinking(true)
      setError(null)

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...history, { role: 'user', content: userText }],
          }),
        })

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`)
        }

        const data = await response.json()
        return data.response
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
        return null
      } finally {
        setIsThinking(false)
      }
    },
    []
  )

  const clearError = useCallback(() => setError(null), [])

  return { sendMessage, isThinking, error, clearError }
}
