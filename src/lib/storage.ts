const PREFIX = 'pochiweb:'

export const KEYS = {
  apiKey: `${PREFIX}apiKey`,
  model: `${PREFIX}model`,
  voiceName: `${PREFIX}voiceName`,
  speechLang: `${PREFIX}speechLang`,
} as const

export function getApiKey(): string {
  return localStorage.getItem(KEYS.apiKey) ?? ''
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEYS.apiKey, key)
}

export function getModel(): string {
  return localStorage.getItem(KEYS.model) ?? 'claude-3-5-haiku-20241022'
}

export function setModel(model: string): void {
  localStorage.setItem(KEYS.model, model)
}

export function getVoiceName(): string {
  return localStorage.getItem(KEYS.voiceName) ?? ''
}

export function setVoiceName(name: string): void {
  localStorage.setItem(KEYS.voiceName, name)
}

export function getSpeechLang(): string {
  return localStorage.getItem(KEYS.speechLang) ?? 'ja-JP'
}

export function setSpeechLang(lang: string): void {
  localStorage.setItem(KEYS.speechLang, lang)
}

export interface Settings {
  apiKey: string
  model: string
  voiceName: string
  speechLang: string
}

export function loadSettings(): Settings {
  return {
    apiKey: getApiKey(),
    model: getModel(),
    voiceName: getVoiceName(),
    speechLang: getSpeechLang(),
  }
}

export function saveSettings(settings: Partial<Settings>): void {
  if (settings.apiKey !== undefined) setApiKey(settings.apiKey)
  if (settings.model !== undefined) setModel(settings.model)
  if (settings.voiceName !== undefined) setVoiceName(settings.voiceName)
  if (settings.speechLang !== undefined) setSpeechLang(settings.speechLang)
}
