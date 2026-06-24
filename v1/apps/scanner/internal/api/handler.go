package api

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"scanner/internal/models"
	"scanner/internal/scanner"
)

type Server struct {
	scanner     *scanner.Scanner
	internalKey string
}

func NewServer(sc *scanner.Scanner, internalKey string) *Server {
	return &Server{
		scanner:     sc,
		internalKey: internalKey,
	}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()

	protected := http.NewServeMux()
	protected.HandleFunc("POST /scans", s.handleScan)
	protected.HandleFunc("POST /verify", s.handleVerify)

	mux.Handle("/", s.internalKeyMiddleware(protected))

	return mux
}

func (s *Server) handleScan(w http.ResponseWriter, r *http.Request) {
	var job models.ScanJob
	if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if job.ScanID == "" || job.URL == "" || job.CallbackURL == "" {
		http.Error(w, "scanId, url and callbackUrl are required", http.StatusBadRequest)
		return
	}

	log.Printf("[handler] received scan job: %s → %s", job.ScanID, job.URL)

	s.scanner.Run(job)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"scanId":  job.ScanID,
		"status":  "accepted",
		"message": "scan started",
	})
}

func (s *Server) handleVerify(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Domain string `json:"domain"`
		Token  string `json:"token"`
		Method string `json:"method"` // "dns" or "file"
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if payload.Domain == "" || payload.Token == "" || payload.Method == "" {
		http.Error(w, "domain, token and method are required", http.StatusBadRequest)
		return
	}

	var verified bool
	var err error

	switch payload.Method {
	case "file":
		verified, err = verifyFile(payload.Domain, payload.Token)
	case "dns":
		verified, err = verifyDNS(payload.Domain, payload.Token)
	default:
		http.Error(w, "method must be 'dns' or 'file'", http.StatusBadRequest)
		return
	}

	if err != nil {
		log.Printf("[handler] verification error for %s: %v", payload.Domain, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{
			"verified": false,
			"error":    err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"verified": verified,
		"domain":   payload.Domain,
		"method":   payload.Method,
	})
}

func verifyFile(domain, token string) (bool, error) {
	url := "https://" + domain + "/.well-known/verisite-verify.txt"
	resp, err := http.Get(url)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, nil
	}

	buf := make([]byte, 256)
	n, _ := resp.Body.Read(buf)
	content := string(buf[:n])

	return content == token || content == token+"\n", nil
}

func verifyDNS(domain, token string) (bool, error) {
	txts, err := net.LookupTXT(domain)
	if err != nil {
		return false, err
	}
	expected := "verisite-verify=" + token
	for _, txt := range txts {
		if txt == expected {
			return true, nil
		}
	}
	return false, nil
}
