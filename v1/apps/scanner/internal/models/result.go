package models

type Severity string

const (
	SeverityCritical Severity = "critical"
	SeverityWarning  Severity = "warning"
	SeverityInfo     Severity = "info"
)

type CheckResult struct {
	ScanID      string   `json:"scanId"`
	Module      string   `json:"module"`
	Check       string   `json:"check"`
	Passed      bool     `json:"passed"`
	Severity    Severity `json:"severity"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Fix         string   `json:"fix"`
}
