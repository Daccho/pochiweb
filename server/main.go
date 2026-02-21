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

	"github.com/joho/godotenv"
)

const (
	Port = "8080"
)

type ChatRequest struct {
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatResponse struct {
	Response string `json:"response"`
}

// Call Anthropic API
func callClaude(apiKey string, messages []Message) (string, error) {
	url := "https://api.anthropic.com/v1/messages"

	// Convert messages to Anthropic format
	anthropicMessages := []map[string]string{}
	for _, m := range messages {
		if m.Role == "user" || m.Role == "assistant" {
			anthropicMessages = append(anthropicMessages, map[string]string{
				"role":    m.Role,
				"content": m.Content,
			})
		}
	}

	requestBody, _ := json.Marshal(map[string]interface{}{
		"model":      "claude-3-5-sonnet-20241022",
		"max_tokens": 1024,
		"system":     "You are Pochi (ぽち) 🧸. A friendly AI assistant. Keep responses warm and helpful.",
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

func chatHandler(w http.ResponseWriter, r *http.Request) {
	// CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	apiKey := os.Getenv("CLAUDE_API_KEY")
	if apiKey == "" {
		http.Error(w, "Server API key not configured", http.StatusInternalServerError)
		return
	}

	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	log.Printf("Received chat request with %d messages", len(req.Messages))

	response, err := callClaude(apiKey, req.Messages)
	if err != nil {
		log.Printf("Error calling LLM: %v", err)
		http.Error(w, fmt.Sprintf("Failed to generate response: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ChatResponse{Response: response})
}

func main() {
	// Load .env file
	_ = godotenv.Load()

	// Serve static files from ../dist
	distPath := filepath.Join("..", "dist")
	fs := http.FileServer(http.Dir(distPath))
	
	// Handle API requests
	http.HandleFunc("/api/chat", chatHandler)
	
	// Handle static files
	http.Handle("/", fs)

	log.Printf("🧸 PochiWeb Server running on port %s", Port)
	log.Fatal(http.ListenAndServe(":"+Port, nil))
}
