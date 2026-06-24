package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/api/internal/status", func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		var v any
		json.Unmarshal(body, &v)
		b, _ := json.MarshalIndent(v, "", "  ")
		fmt.Println("[STATUS]", string(b))
		w.WriteHeader(http.StatusOK)
	})

	http.HandleFunc("/api/internal/results", func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		var v any
		json.Unmarshal(body, &v)
		b, _ := json.MarshalIndent(v, "", "  ")
		fmt.Println("[RESULT]", string(b))
		w.WriteHeader(http.StatusOK)
	})

	http.HandleFunc("/api/internal/summary", func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		var v any
		json.Unmarshal(body, &v)
		b, _ := json.MarshalIndent(v, "", "  ")
		fmt.Println("[SUMMARY]", string(b))
		w.WriteHeader(http.StatusOK)
	})

	log.Println("[mockserver] listening on :3000")
	http.ListenAndServe(":3000", nil)
}