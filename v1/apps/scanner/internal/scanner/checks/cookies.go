package checks

import (
	"net/http"
	"scanner/internal/models"
	"strings"
	"time"
)

func RunCookies(url string) []models.CheckResult {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return []models.CheckResult{{
			Module:      "cookies",
			Check:       "reachability",
			Passed:      false,
			Severity:    models.SeverityCritical,
			Title:       "Site unreachable for cookie check",
			Description: "Could not connect to your site to inspect cookies.",
			Fix:         "Ensure your site is publicly accessible.",
		}}
	}
	defer resp.Body.Close()

	cookies := resp.Cookies()

	if len(cookies) == 0 {
		return []models.CheckResult{{
			Module:      "cookies",
			Check:       "cookies_present",
			Passed:      true,
			Severity:    models.SeverityInfo,
			Title:       "No cookies set on initial load",
			Description: "No cookies were found on the initial page load.",
		}}
	}

	var results []models.CheckResult
	for _, cookie := range cookies {
		results = append(results, checkSecureFlag(cookie))
		results = append(results, checkHttpOnly(cookie))
		results = append(results, checkSameSite(cookie))
	}
	return results
}

func checkSecureFlag(cookie *http.Cookie) models.CheckResult {
	return models.CheckResult{
		Module:      "cookies",
		Check:       "cookie_secure_" + cookie.Name,
		Passed:      cookie.Secure,
		Severity:    models.SeverityWarning,
		Title:       secureFlagTitle(cookie),
		Description: secureDescription(cookie),
		Fix:         "Set the Secure flag on the \"" + cookie.Name + "\" cookie so it is only sent over HTTPS.",
	}
}

func checkHttpOnly(cookie *http.Cookie) models.CheckResult {
	return models.CheckResult{
		Module:      "cookies",
		Check:       "cookie_httponly_" + cookie.Name,
		Passed:      cookie.HttpOnly,
		Severity:    models.SeverityWarning,
		Title:       httpOnlyTitle(cookie),
		Description: httpOnlyDescription(cookie),
		Fix:         "Set the HttpOnly flag on the \"" + cookie.Name + "\" cookie to prevent JavaScript from accessing it.",
	}
}

func checkSameSite(cookie *http.Cookie) models.CheckResult {
	set := cookie.SameSite != http.SameSiteDefaultMode
	return models.CheckResult{
		Module:      "cookies",
		Check:       "cookie_samesite_" + cookie.Name,
		Passed:      set,
		Severity:    models.SeverityInfo,
		Title:       sameSiteTitle(cookie, set),
		Description: sameSiteDescription(cookie, set),
		Fix:         "Set SameSite=Strict or SameSite=Lax on the \"" + cookie.Name + "\" cookie to prevent CSRF attacks.",
	}
}

func secureFlagTitle(c *http.Cookie) string {
	if c.Secure {
		return "Cookie \"" + c.Name + "\" has Secure flag"
	}
	return "Cookie \"" + c.Name + "\" is missing Secure flag"
}

func secureDescription(c *http.Cookie) string {
	if c.Secure {
		return ""
	}
	return "The \"" + c.Name + "\" cookie can be sent over unencrypted HTTP connections, exposing it to interception."
}

func httpOnlyTitle(c *http.Cookie) string {
	if c.HttpOnly {
		return "Cookie \"" + c.Name + "\" has HttpOnly flag"
	}
	return "Cookie \"" + c.Name + "\" is missing HttpOnly flag"
}

func httpOnlyDescription(c *http.Cookie) string {
	if c.HttpOnly {
		return ""
	}
	return "The \"" + c.Name + "\" cookie is accessible via JavaScript. If your site has an XSS vulnerability, attackers can steal this cookie."
}

func sameSiteTitle(c *http.Cookie, set bool) string {
	if set {
		return "Cookie \"" + c.Name + "\" has SameSite attribute"
	}
	return "Cookie \"" + c.Name + "\" is missing SameSite attribute"
}

func sameSiteDescription(c *http.Cookie, set bool) string {
	if set {
		return ""
	}
	return "The \"" + c.Name + "\" cookie has no SameSite attribute, making it potentially vulnerable to cross-site request forgery (CSRF)."
}

func containsString(slice []string, s string) bool {
	for _, v := range slice {
		if strings.EqualFold(v, s) {
			return true
		}
	}
	return false
}