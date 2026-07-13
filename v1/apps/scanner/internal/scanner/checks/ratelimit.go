package checks

import (
	"net/http"
	"scanner/internal/models"
	"strings"
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

// Keep this low and paced. This check exists to see whether an endpoint
// *would* survive a brute-force attempt, not to actually brute-force a
// stranger's site. A small, spaced-out sample is enough to detect whether
// blocking behavior exists at all - it doesn't need to be a real attack.
const (
	rateLimitProbeCount = 8
	rateLimitProbeDelay = 300 * time.Millisecond
)

var captchaSignals = []string{"captcha", "recaptcha", "hcaptcha", "please verify you are human"}

func RunRateLimit(url string) []models.CheckResult {
	base := strings.TrimRight(url, "/")
	loginPath, initialStatus := findLoginPath(base)
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
		testRateLimit(base+loginPath, initialStatus),
	}
}

// findLoginPath returns the first matching path and the status code seen there,
// so testRateLimit can tell later whether a 4xx from the probe requests is
// meaningful or just the endpoint's normal response to a malformed request.
func findLoginPath(base string) (string, int) {
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
		status := resp.StatusCode
		resp.Body.Close()
		if status == http.StatusOK || status == http.StatusMethodNotAllowed {
			return path, status
		}
	}
	return "", 0
}

func testRateLimit(target string, initialStatus int) models.CheckResult {
	client := &http.Client{Timeout: 3 * time.Second}

	result := models.CheckResult{
		Module:   "ratelimit",
		Check:    "login_ratelimit",
		Severity: models.SeverityWarning,
	}

	var (
		blockedSeen     bool
		successCount    int
		malformedCount  int // 4xx unrelated to rate limiting (e.g. 400, 404, 422) - suggests our payload shape isn't accepted
		connectionFails int
	)

	for i := 0; i < rateLimitProbeCount; i++ {
		if i > 0 {
			time.Sleep(rateLimitProbeDelay)
		}
		resp, err := client.Post(target, "application/json", strings.NewReader(`{"email":"test@test.com","password":"test"}`))
		if err != nil {
			connectionFails++
			continue
		}

		switch {
		case resp.StatusCode == http.StatusTooManyRequests:
			blockedSeen = true
		case resp.StatusCode == http.StatusForbidden && i > 0:
			// A 403 that appears only after earlier requests succeeded is a
			// common WAF/soft-block signal, distinct from an endpoint that's
			// just always 403 (which findLoginPath would already have skipped
			// via its own OK/405 filter, but double check here too).
			if successCount > 0 {
				blockedSeen = true
			}
		case resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusUnauthorized:
			successCount++
			body := readSmallBody(resp)
			if containsCaptchaSignal(body) {
				blockedSeen = true
			}
		case resp.StatusCode >= 400 && resp.StatusCode < 500:
			malformedCount++
		}
		resp.Body.Close()
	}

	// If most probes failed to connect or came back malformed, we didn't
	// actually exercise the endpoint - say so instead of claiming a finding.
	if connectionFails >= rateLimitProbeCount/2 {
		result.Passed = true
		result.Severity = models.SeverityInfo
		result.Title = "Rate limit check inconclusive (endpoint unreachable during test)"
		result.Description = "Verisite could not reliably reach the login endpoint enough times to test rate limiting."
		return result
	}
	if malformedCount >= rateLimitProbeCount-1 {
		result.Passed = true
		result.Severity = models.SeverityInfo
		result.Title = "Rate limit check inconclusive"
		result.Description = "The login endpoint consistently rejected the test payload format, so rate limiting could not be reliably tested."
		return result
	}

	result.Passed = blockedSeen
	if blockedSeen {
		result.Title = "Login endpoint shows rate limiting or bot-blocking behavior"
	} else {
		result.Title = "Login endpoint is not rate limited"
		result.Description = "Verisite sent " + itoa(rateLimitProbeCount) + " spaced-out login attempts and saw no blocking response (429, WAF block, or CAPTCHA). An attacker could run automated password guessing (brute force) without being blocked."
		result.Fix = "Implement rate limiting on your login endpoint - e.g. a maximum of 5-10 attempts per IP per minute, ideally backed by exponential backoff or a CAPTCHA after repeated failures."
	}
	return result
}

func readSmallBody(resp *http.Response) string {
	defer resp.Body.Close()
	buf := make([]byte, 2048)
	n, _ := resp.Body.Read(buf)
	return string(buf[:n])
}

func containsCaptchaSignal(body string) bool {
	lower := strings.ToLower(body)
	for _, sig := range captchaSignals {
		if strings.Contains(lower, sig) {
			return true
		}
	}
	return false
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	digits := []byte{}
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	return string(digits)
}