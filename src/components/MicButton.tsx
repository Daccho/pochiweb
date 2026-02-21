import { useEffect } from 'react'

interface MicButtonProps {
  isListening: boolean
  isThinking?: boolean
  isSpeaking?: boolean
  isDisabled: boolean
  onPress: () => void
  onRelease: () => void
  onMouseDown?: () => void
  onMouseUp?: () => void
  onTouchStart?: () => void
  onTouchEnd?: () => void
}

export function MicButton({ 
  isListening, 
  isThinking,
  isSpeaking,
  isDisabled, 
  onPress, 
  onRelease,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd
}: MicButtonProps) {
  // Keyboard support: hold Space to speak
  useEffect(() => {
    let pressed = false

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !pressed && !isDisabled) {
        e.preventDefault()
        pressed = true
        onPress()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && pressed) {
        e.preventDefault()
        pressed = false
        onRelease()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onPress, onRelease, isDisabled])

  const statusText = isListening ? '話してください…' : 
                     isThinking ? '考え中...' : 
                     isSpeaking ? '話しています...' : 
                     isDisabled ? '処理中...' : '押して話す / Hold Space'

  const effectiveOnMouseDown = onMouseDown || (!isDisabled ? onPress : undefined)
  const effectiveOnMouseUp = onMouseUp || (!isDisabled ? onRelease : undefined)
  const effectiveOnTouchStart = onTouchStart || (!isDisabled ? (e: any) => { e.preventDefault(); onPress() } : undefined)
  const effectiveOnTouchEnd = onTouchEnd || (!isDisabled ? (e: any) => { e.preventDefault(); onRelease() } : undefined)

  return (
    <div className="mic-wrapper">
      <button
        className={`mic-button${isListening ? ' mic-button--listening' : ''}${isThinking ? ' mic-button--thinking' : ''}${isSpeaking ? ' mic-button--speaking' : ''}${isDisabled ? ' mic-button--disabled' : ''}`}
        onMouseDown={effectiveOnMouseDown}
        onMouseUp={effectiveOnMouseUp}
        onTouchStart={effectiveOnTouchStart}
        onTouchEnd={effectiveOnTouchEnd}
        disabled={isDisabled}
        aria-label={statusText}
      >
        <MicIcon isListening={isListening} isThinking={isThinking} isSpeaking={isSpeaking} />
      </button>
      <p className="mic-hint">
        {statusText}
      </p>
    </div>
  )
}

function MicIcon({ isListening, isThinking, isSpeaking }: { isListening: boolean, isThinking?: boolean, isSpeaking?: boolean }) {
  const color = isListening ? '#ff4444' : isThinking ? '#ffeb3b' : isSpeaking ? '#00e676' : 'currentColor'
  
  if (isThinking) return <span>💭</span>
  if (isSpeaking) return <span>🔊</span>

  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="9"
        y="2"
        width="6"
        height="11"
        rx="3"
        fill={isListening ? color : 'currentColor'}
      />
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke={isListening ? color : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="22"
        stroke={isListening ? color : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="22"
        x2="15"
        y2="22"
        stroke={isListening ? color : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
