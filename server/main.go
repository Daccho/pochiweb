package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

const (
	Port = "8080"
)

// --- Types ---

// Web Request (Standard)
type ChatRequestWeb struct {
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// WearOS Request (Legacy)
type ChatRequestWear struct {
	Message string `json:"message"`
	Session string `json:"session"`
}

// Common Response
type ChatResponse struct {
	Response string `json:"response"`
}

// --- Logic ---

func loadContext() string {
	files := []string{"IDENTITY.md", "SOUL.md", "USER.md"}
	var context strings.Builder
	
	// Try to load from ./context directory (Docker/Cloud Run)
	baseDir := "./context" 
	if _, err := os.Stat(baseDir); os.IsNotExist(err) {
		// Fallback for local dev
		baseDir = "../../.openclaw/workspace" 
	}

	for _, file := range files {
		path := filepath.Join(baseDir, file)
		content, err := ioutil.ReadFile(path)
		if err == nil {
			context.WriteString(fmt.Sprintf("\n\n--- %s ---\n%s", file, string(content)))
		}
	}
	return context.String()
}

func callClaude(apiKey string, messages []Message) (string, error) {
	url := "https://api.anthropic.com/v1/messages"
	
	systemPrompt := "You are Pochi (ぽち) 🧸. Your personality context is loaded below. Keep responses warm, helpful, and concise." + loadContext()

	// Build Anthropic messages
	anthropicMessages := []map[string]string{}
	for _, m := range messages {
		role := m.Role
		if role != "user" && role != "assistant" {
			continue
		}
		anthropicMessages = append(anthropicMessages, map[string]string{
			"role":    role,
			"content": m.Content,
		})
	}

	requestBody, _ := json.Marshal(map[string]interface{}{
		"model":      "claude-3-haiku-20240307",
		"max_tokens": 1024,
		"system":     systemPrompt,
		"messages":   anthropicMessages,
	})

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(requestBody))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		return "", fmt.Errorf("API error: %s", string(bodyBytes))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	content := result["content"].([]interface{})
	firstBlock := content[0].(map[string]interface{})
	text := firstBlock["text"].(string)
	return text, nil
}

// --- Handlers ---

func chatHandlerWeb(w http.ResponseWriter, r *http.Request) {
	setupCORS(w, r)
	if r.Method == http.MethodOptions { return }

	apiKey := getAPIKey()
	if apiKey == "" {
		http.Error(w, "Server API key not configured", http.StatusInternalServerError)
		return
	}

	var req ChatRequestWeb
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	log.Printf("[Web] Received chat with %d messages", len(req.Messages))
	handleChat(w, apiKey, req.Messages)
}

func chatHandlerWear(w http.ResponseWriter, r *http.Request) {
	setupCORS(w, r)
	if r.Method == http.MethodOptions { return }

	apiKey := getAPIKey()
	if apiKey == "" {
		http.Error(w, "Server API key not configured", http.StatusInternalServerError)
		return
	}

	var req ChatRequestWear
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	log.Printf("[WearOS] Received message: %s", req.Message)
	
	// Convert single message to history format
	messages := []Message{{Role: "user", Content: req.Message}}
	handleChat(w, apiKey, messages)
}

func handleChat(w http.ResponseWriter, apiKey string, messages []Message) {
	response, err := callClaude(apiKey, messages)
	if err != nil {
		log.Printf("Error calling LLM: %v", err)
		http.Error(w, fmt.Sprintf("Failed to generate response: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ChatResponse{Response: response})
}

func setupCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func getAPIKey() string {
	key := os.Getenv("CLAUDE_API_KEY")
	if key == "" {
		key = os.Getenv("ANTHROPIC_API_KEY")
	}
	return strings.TrimSpace(key)
}

func main() {
	_ = godotenv.Load()

	// Web Endpoint
	http.HandleFunc("/api/chat", chatHandlerWeb)
	
	// WearOS Endpoint (Compatibility)
	http.HandleFunc("/api/v1/chat", chatHandlerWear)

	// Health Check (for Cloud Run)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("🧸 Pochi Server is running!"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = Port
	}

	log.Printf("🧸 Pochi Server running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
