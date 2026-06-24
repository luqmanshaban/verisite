package scanner

import (
	"scanner/internal/models"
	"scanner/internal/notifier"
	"scanner/internal/scanner/checks"
	"sync"
)

type Scanner struct {
	notifier *notifier.Notifier
}

func New(n *notifier.Notifier) *Scanner {
	return &Scanner{notifier: n}
}

func (s *Scanner) Run(job models.ScanJob) {
	go s.run(job)
}

func (s *Scanner) run(job models.ScanJob) {
	s.notifier.SendStatus(job.CallbackURL, job.ScanID, models.StatusRunning)

	runners := []func(string) []models.CheckResult{
		checks.RunHeaders,
		checks.RunExposure,
		checks.RunCookies,
		checks.RunRateLimit,
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	var allResults []models.CheckResult

	for _, runner := range runners {
		wg.Add(1)
		go func(fn func(string) []models.CheckResult) {
			defer wg.Done()
			results := fn(job.URL)
			mu.Lock()
			allResults = append(allResults, results...)
			mu.Unlock()
			for _, r := range results {
				r.ScanID = job.ScanID
				s.notifier.SendResult(job.CallbackURL, r)
			}
		}(runner)
	}

	wg.Wait()

	summary := computeSummary(job.ScanID, allResults)
	s.notifier.SendSummary(job.CallbackURL, summary)
}

func computeSummary(scanID string, results []models.CheckResult) models.ScanSummary {
	score := 100
	for _, r := range results {
		if r.Passed {
			continue
		}
		switch r.Severity {
		case models.SeverityCritical:
			score -= 20
		case models.SeverityWarning:
			score -= 8
		case models.SeverityInfo:
			score -= 3
		}
	}
	if score < 0 {
		score = 0
	}
	return models.ScanSummary{
		ScanID: scanID,
		Score:  score,
		Grade:  grade(score),
		Status: models.StatusCompleted,
	}
}

func grade(score int) string {
	switch {
	case score >= 90:
		return "A"
	case score >= 75:
		return "B"
	case score >= 60:
		return "C"
	case score >= 45:
		return "D"
	default:
		return "F"
	}
}