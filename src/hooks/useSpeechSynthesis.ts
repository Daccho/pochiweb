import { useCallback, useEffect, useState } from 'react'

interface UseSpeechSynthesisResult {
  speak: (text: string) => void
  stop: () => void
  isSpeaking: boolean
  voices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
  setSelectedVoiceByName: (name: string) => void
}

export function useSpeechSynthesis(voiceName: string = ''): UseSpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

  const loadVoices = useCallback(() => {
    const available = window.speechSynthesis.getVoices()
    if (available.length > 0) {
      setVoices(available)
    }
  }, [])

  useEffect(() => {
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [loadVoices])

  // Update selected voice when voices list loads or voiceName changes
  useEffect(() => {
    if (voices.length === 0) return
    if (voiceName) {
      const found = voices.find((v) => v.name === voiceName)
      setSelectedVoice(found ?? voices[0])
    } else {
      setSelectedVoice(voices[0])
    }
  }, [voices, voiceName])

  const setSelectedVoiceByName = useCallback(
    (name: string) => {
      const found = voices.find((v) => v.name === name)
      if (found) setSelectedVoice(found)
    },
    [voices],
  )

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!text) return
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    },
    [selectedVoice],
  )

  return { speak, stop, isSpeaking, voices, selectedVoice, setSelectedVoiceByName }
}
