import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSpeechRecognitionResult {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  isSupported: boolean
  error: string | null
}

export function useSpeechRecognition(lang: string = 'ja-JP'): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const createRecognition = useCallback(() => {
    if (!isSupported) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = lang
    return recognition
  }, [lang, isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('SpeechRecognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    setError(null)
    setTranscript('')

    const recognition = createRecognition()
    if (!recognition) return

    recognitionRef.current = recognition

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      if (result.isFinal) {
        setTranscript(result[0].transcript.trim())
      }
    }

    recognition.onerror = (event: { error: string }) => {
      if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    setIsListening(true)
  }, [isSupported, createRecognition])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  return { isListening, transcript, startListening, stopListening, isSupported, error }
}
