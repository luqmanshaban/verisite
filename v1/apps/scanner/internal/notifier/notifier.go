package notifier

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"scanner/internal/models"
	"time"
)

type Notifier struct {
	internalKey string
	client      *http.Client
}

func New(internalKey string) *Notifier {
	return &Notifier{
		internalKey: internalKey,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

func (n *Notifier) SendResult(callbackURL string, result models.CheckResult) {
	n.post(callbackURL+"/api/internal/results", result)
}

func (n *Notifier) SendSummary(callbackURL string, summary models.ScanSummary) {
	n.post(callbackURL+"/api/internal/summary", summary)
}

func (n *Notifier) SendStatus(callbackURL string, scanID string, status models.ScanStatus) {
	payload := map[string]string{
		"scanId": scanID,
		"status": string(status),
	}
	n.post(callbackURL+"/api/internal/status", payload)
}

func (n *Notifier) post(url string, payload any) {
	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[notifier] failed to marshal payload for %s: %v", url, err)
		return
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		log.Printf("[notifier] failed to create request for %s: %v", url, err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Key", n.internalKey)

	resp, err := n.client.Do(req)
	if err != nil {
		log.Printf("[notifier] failed to post to %s: %v", url, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("[notifier] bad response from %s: %d", url, resp.StatusCode)
	}
}