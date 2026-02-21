package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Messages []Message `json:"messages"`
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
		"model":      "claude-3-haiku-20240307",
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

// Vercel Entrypoint
func Handler(w http.ResponseWriter, r *http.Request) {
	// Vercel handles CORS automatically mostly, but good to have specific headers if needed
	// For Vercel API routes, we often just proceed.

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	apiKey := os.Getenv("CLAUDE_API_KEY")
	if apiKey == "" {
		http.Error(w, "Server API key not configured in Vercel Environment Variables", http.StatusInternalServerError)
		return
	}

	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	response, err := callClaude(apiKey, req.Messages)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to generate response: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ChatResponse{Response: response})
}
