type AppStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

interface StatusBarProps {
  status: AppStatus
  errorMessage?: string | null
}

const STATUS_LABELS: Record<AppStatus, string> = {
  idle: '準備完了',
  listening: '🎤 聞いています...',
  thinking: '💭 考えています...',
  speaking: '🔊 話しています...',
  error: '⚠️ エラー',
}

export function StatusBar({ status, errorMessage }: StatusBarProps) {
  return (
    <div className={`status-bar status-bar--${status}`}>
      <span className="status-dot" />
      <span className="status-label">
        {status === 'error' && errorMessage ? errorMessage : STATUS_LABELS[status]}
      </span>
    </div>
  )
}

export type { AppStatus }
