package checks

import (
	"net/http"
	"scanner/internal/models"
	"time"
)

func RunHeaders(url string) []models.CheckResult {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return []models.CheckResult{{
			Module:      "headers",
			Check:       "reachability",
			Passed:      false,
			Severity:    models.SeverityCritical,
			Title:       "Site unreachable",
			Description: "Verisite could not connect to your site.",
			Fix:         "Ensure your site is publicly accessible and the URL is correct.",
		}}
	}
	defer resp.Body.Close()

	h := resp.Header
	return []models.CheckResult{
		checkHeader(h, "Strict-Transport-Security", "headers", "hsts",
			models.SeverityCritical,
			"HSTS not configured",
			"Your site does not enforce HTTPS strictly. Attackers can intercept traffic by downgrading connections to HTTP.",
			"Add the header: Strict-Transport-Security: max-age=31536000; includeSubDomains",
		),
		checkHeader(h, "Content-Security-Policy", "headers", "csp",
			models.SeverityWarning,
			"No Content Security Policy",
			"Without a CSP, your site is more vulnerable to cross-site scripting (XSS) attacks that can steal user data.",
			"Define a Content-Security-Policy header that whitelists trusted sources for scripts, styles, and images.",
		),
		checkHeader(h, "X-Frame-Options", "headers", "x_frame_options",
			models.SeverityWarning,
			"Clickjacking protection missing",
			"Your site can be embedded in an iframe on another site. Attackers use this to trick users into clicking things they didn't intend to.",
			"Add the header: X-Frame-Options: DENY or SAMEORIGIN",
		),
		checkHeader(h, "X-Content-Type-Options", "headers", "x_content_type",
			models.SeverityInfo,
			"MIME sniffing protection missing",
			"Browsers may try to guess the content type of responses, which can lead to security issues.",
			"Add the header: X-Content-Type-Options: nosniff",
		),
		checkHeader(h, "Referrer-Policy", "headers", "referrer_policy",
			models.SeverityInfo,
			"No Referrer Policy set",
			"Your site may leak the full URL of pages to third-party sites via the Referer header.",
			"Add the header: Referrer-Policy: strict-origin-when-cross-origin",
		),
		checkServerHeader(h),
		checkPoweredBy(h),
	}
}

func checkHeader(h http.Header, name, module, check string, severity models.Severity, title, description, fix string) models.CheckResult {
	present := h.Get(name) != ""
	result := models.CheckResult{
		Module:      module,
		Check:       check,
		Passed:      present,
		Severity:    severity,
		Title:       title,
		Description: description,
		Fix:         fix,
	}
	if present {
		result.Title = name + " is configured"
		result.Description = ""
		result.Fix = ""
	}
	return result
}

func checkServerHeader(h http.Header) models.CheckResult {
	server := h.Get("Server")
	leaking := server != "" && len(server) > 0
	result := models.CheckResult{
		Module:   "headers",
		Check:    "server_header",
		Passed:   !leaking,
		Severity: models.SeverityInfo,
	}
	if leaking {
		result.Title = "Server header reveals software info"
		result.Description = "Your server is advertising what software it runs: \"" + server + "\". Attackers use this to find known vulnerabilities."
		result.Fix = "Configure your server to remove or obscure the Server header."
	} else {
		result.Title = "Server header is clean"
	}
	return result
}

func checkPoweredBy(h http.Header) models.CheckResult {
	val := h.Get("X-Powered-By")
	leaking := val != ""
	result := models.CheckResult{
		Module:   "headers",
		Check:    "powered_by",
		Passed:   !leaking,
		Severity: models.SeverityInfo,
	}
	if leaking {
		result.Title = "X-Powered-By header is exposed"
		result.Description = "Your app is revealing its framework: \"" + val + "\". This helps attackers target known exploits."
		result.Fix = "Remove the X-Powered-By header. In Express.js: app.disable('x-powered-by')"
	} else {
		result.Title = "X-Powered-By header is hidden"
	}
	return result
}