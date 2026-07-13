package checks

import (
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"scanner/internal/models"
	"strings"
	"time"
)

type sensitivePathCheck struct {
	path        string
	check       string
	title       string
	description string
	fix         string
	severity    models.Severity
	// contentSignature, if set, must be found in the response body (case-insensitive)
	// for a 200 that differs from baseline to actually count as exposed.
	// Leave empty for paths where "differs from baseline" alone is enough (admin, swagger, api docs).
	contentSignature []string
}

var sensitivePaths = []sensitivePathCheck{
	{
		path:             "/.env",
		check:            "env_exposed",
		severity:         models.SeverityCritical,
		title:            ".env file is publicly accessible",
		description:      "Your environment file is exposed. It likely contains database credentials, API keys, and secrets that give attackers full access to your systems.",
		fix:              "Block access to .env in your server config. In Nginx: location ~ /\\.env { deny all; }",
		contentSignature: []string{"="}, // env files are near-universally KEY=VALUE lines
	},
	{
		path:             "/.git/config",
		check:            "git_exposed",
		severity:         models.SeverityCritical,
		title:            "Git repository is exposed",
		description:      "Your .git directory is publicly accessible. Attackers can reconstruct your entire source code including secrets committed to history.",
		fix:              "Block access to .git in your server config. Never deploy with .git directory accessible.",
		contentSignature: []string{"[core]", "repositoryformatversion"},
	},
	{
		path:        "/admin",
		check:       "admin_exposed",
		severity:    models.SeverityWarning,
		title:       "Admin panel is publicly accessible",
		description: "Your /admin route is reachable without any apparent access control. Attackers will target this directly.",
		fix:         "Restrict /admin to authenticated users only. Consider moving it to a non-standard path.",
	},
	{
		path:        "/api/docs",
		check:       "api_docs_exposed",
		severity:    models.SeverityWarning,
		title:       "API documentation is publicly exposed",
		description: "Your API docs are publicly accessible. This gives attackers a full map of your endpoints, parameters, and data structures.",
		fix:         "Restrict API docs to authenticated users or internal networks only.",
	},
	{
		path:        "/swagger",
		check:       "swagger_exposed",
		severity:    models.SeverityWarning,
		title:       "Swagger UI is publicly accessible",
		description: "Swagger UI exposes your full API surface to anyone. Attackers use this to find unprotected endpoints.",
		fix:         "Disable Swagger in production or restrict it to authenticated users.",
	},
	{
		path:             "/phpinfo.php",
		check:            "phpinfo_exposed",
		severity:         models.SeverityCritical,
		title:            "phpinfo() page is accessible",
		description:      "This page exposes your full server configuration, PHP version, loaded modules, and environment variables.",
		fix:              "Delete phpinfo.php from your server immediately.",
		contentSignature: []string{"phpinfo()", "php version"},
	},
}

func RunExposure(url string) []models.CheckResult {
	client := &http.Client{
		Timeout: 5 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	base := strings.TrimRight(url, "/")

	baseline, baselineErr := fetchBaseline(client, base)
	if baselineErr != nil {
		// Site is unreachable. Do NOT report every check as "passed" -
		// report a single honest failure, same pattern as headers/cookies checks.
		return []models.CheckResult{{
			Module:      "exposure",
			Check:       "reachability",
			Passed:      false,
			Severity:    models.SeverityCritical,
			Title:       "Site unreachable for exposure checks",
			Description: "Could not connect to your site, so exposure checks could not run.",
			Fix:         "Ensure your site is publicly accessible and the URL is correct.",
		}}
	}

	var results []models.CheckResult
	for _, sp := range sensitivePaths {
		results = append(results, checkPath(client, base, sp, baseline))
	}
	return results
}

// fetchBaseline requests a random, near-certainly-nonexistent path so we have
// something to compare sensitive-path responses against. Many SPAs return 200
// with the same fallback page for any unmatched route - without this baseline
// every sensitive path looks "exposed" just because the app returns 200 for it.
func fetchBaseline(client *http.Client, base string) (string, error) {
	randPath := fmt.Sprintf("/verisite-probe-%d-nonexistent", rand.Int63())
	resp, err := client.Get(base + randPath)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	if err != nil {
		return "", err
	}
	return string(body), nil
}

func checkPath(client *http.Client, base string, sp sensitivePathCheck, baseline string) models.CheckResult {
	target := base + sp.path
	result := models.CheckResult{
		Module:   "exposure",
		Check:    sp.check,
		Severity: sp.severity,
	}

	resp, err := client.Get(target)
	if err != nil {
		// Could not reach this specific path - inconclusive, not a pass.
		// Treat as low-severity "could not verify" rather than silently passing.
		result.Passed = true
		result.Severity = models.SeverityInfo
		result.Title = sp.path + " could not be checked (request failed)"
		return result
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		result.Passed = true
		result.Title = sp.path + " is not accessible"
		return result
	}

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	bodyStr := string(body)

	// If the response is basically identical to the baseline (same length within a
	// small tolerance, or an exact match), this is almost certainly a catch-all
	// route serving the same fallback page, not a real exposure.
	if looksLikeBaseline(bodyStr, baseline) {
		result.Passed = true
		result.Title = sp.path + " returns your site's default page (not actually exposed)"
		return result
	}

	// Body differs from baseline. For checks with a content signature, require
	// that signature to be present before calling it exposed - a 200 with an
	// unrelated custom 404 page shouldn't count either.
	if len(sp.contentSignature) > 0 && !containsAny(bodyStr, sp.contentSignature) {
		result.Passed = true
		result.Title = sp.path + " returned a 200 but does not appear to contain " + sp.title
		return result
	}

	result.Passed = false
	result.Title = sp.title
	result.Description = sp.description
	result.Fix = sp.fix
	return result
}

func looksLikeBaseline(body, baseline string) bool {
	if baseline == "" {
		return false
	}
	if body == baseline {
		return true
	}
	// allow small tolerance for things like embedded timestamps/nonces in the fallback page
	lenDiff := len(body) - len(baseline)
	if lenDiff < 0 {
		lenDiff = -lenDiff
	}
	tolerance := len(baseline) / 20 // 5%
	if tolerance < 20 {
		tolerance = 20
	}
	return lenDiff <= tolerance
}

func containsAny(body string, signatures []string) bool {
	lower := strings.ToLower(body)
	for _, sig := range signatures {
		if strings.Contains(lower, strings.ToLower(sig)) {
			return true
		}
	}
	return false
}