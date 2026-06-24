package models

type ScanStatus string

const (
	StatusPending   ScanStatus = "pending"
	StatusRunning   ScanStatus = "running"
	StatusCompleted ScanStatus = "completed"
	StatusFailed    ScanStatus = "failed"
)

type ScanJob struct {
	ScanID      string `json:"scanId"`
	URL         string `json:"url"`
	Domain      string `json:"domain"`
	CallbackURL string `json:"callbackUrl"`
}

type ScanSummary struct {
	ScanID string     `json:"scanId"`
	Score  int        `json:"score"`
	Grade  string     `json:"grade"`
	Status ScanStatus `json:"status"`
}