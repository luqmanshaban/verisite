package checks

import (
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
}

var sensitivePaths = []sensitivePathCheck{
	{
		path:        "/.env",
		check:       "env_exposed",
		severity:    models.SeverityCritical,
		title:       ".env file is publicly accessible",
		description: "Your environment file is exposed. It likely contains database credentials, API keys, and secrets that give attackers full access to your systems.",
		fix:         "Block access to .env in your server config. In Nginx: location ~ /\\.env { deny all; }",
	},
	{
		path:        "/.git/config",
		check:       "git_exposed",
		severity:    models.SeverityCritical,
		title:       "Git repository is exposed",
		description: "Your .git directory is publicly accessible. Attackers can reconstruct your entire source code including secrets committed to history.",
		fix:         "Block access to .git in your server config. Never deploy with .git directory accessible.",
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
		path:        "/phpinfo.php",
		check:       "phpinfo_exposed",
		severity:    models.SeverityCritical,
		title:       "phpinfo() page is accessible",
		description: "This page exposes your full server configuration, PHP version, loaded modules, and environment variables.",
		fix:         "Delete phpinfo.php from your server immediately.",
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
	var results []models.CheckResult

	for _, sp := range sensitivePaths {
		result := checkPath(client, base, sp)
		results = append(results, result)
	}

	return results
}

func checkPath(client *http.Client, base string, sp sensitivePathCheck) models.CheckResult {
	target := base + sp.path
	resp, err := client.Get(target)

	result := models.CheckResult{
		Module:   "exposure",
		Check:    sp.check,
		Severity: sp.severity,
	}

	if err != nil {
		result.Passed = true
		result.Title = sp.path + " is not accessible"
		return result
	}
	defer resp.Body.Close()

	exposed := resp.StatusCode == http.StatusOK
	result.Passed = !exposed

	if exposed {
		result.Title = sp.title
		result.Description = sp.description
		result.Fix = sp.fix
	} else {
		result.Title = sp.path + " is not accessible"
	}

	return result
}