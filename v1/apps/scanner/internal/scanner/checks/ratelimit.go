package checks

import (
	"net/http"
	"scanner/internal/models"
	"strings"
	"sync"
	"time"
)

var commonLoginPaths = []string{
	"/login",
	"/signin",
	"/api/login",
	"/api/signin",
	"/api/auth/login",
	"/auth/login",
	"/user/login",
}

func RunRateLimit(url string) []models.CheckResult {
	base := strings.TrimRight(url, "/")
	loginPath := findLoginPath(base)

	if loginPath == "" {
		return []models.CheckResult{{
			Module:      "ratelimit",
			Check:       "login_ratelimit",
			Passed:      true,
			Severity:    models.SeverityInfo,
			Title:       "No common login endpoint detected",
			Description: "Verisite could not find a common login path to test rate limiting.",
		}}
	}

	return []models.CheckResult{
		testRateLimit(base+loginPath, "login_ratelimit",
			"Login endpoint is not rate limited",
			"Your login page accepts unlimited requests. An attacker can run automated password guessing attacks (brute force) without being blocked.",
			"Implement rate limiting on your login endpoint. Allow a maximum of 5–10 attempts per IP per minute.",
		),
	}
}

func findLoginPath(base string) string {
	client := &http.Client{
		Timeout: 4 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}

	for _, path := range commonLoginPaths {
		resp, err := client.Get(base + path)
		if err != nil {
			continue
		}
		resp.Body.Close()
		if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusMethodNotAllowed {
			return path
		}
	}
	return ""
}

func testRateLimit(target, check, title, description, fix string) models.CheckResult {
	client := &http.Client{Timeout: 3 * time.Second}
	const requestCount = 20

	var wg sync.WaitGroup
	statusCodes := make([]int, requestCount)

	for i := 0; i < requestCount; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			resp, err := client.Post(target, "application/json", strings.NewReader(`{"email":"test@test.com","password":"test"}`))
			if err != nil {
				statusCodes[idx] = 0
				return
			}
			defer resp.Body.Close()
			statusCodes[idx] = resp.StatusCode
		}(i)
	}
	wg.Wait()

	rateLimited := false
	for _, code := range statusCodes {
		if code == http.StatusTooManyRequests || code == 429 {
			rateLimited = true
			break
		}
	}

	result := models.CheckResult{
		Module:   "ratelimit",
		Check:    check,
		Passed:   rateLimited,
		Severity: models.SeverityWarning,
	}

	if rateLimited {
		result.Title = "Login endpoint is rate limited"
	} else {
		result.Title = title
		result.Description = description
		result.Fix = fix
	}

	return result
}