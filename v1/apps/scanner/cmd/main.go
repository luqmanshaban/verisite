package main

import (
	"log"
	"net/http"
	"os"
	"scanner/internal/api"
	"scanner/internal/notifier"
	"scanner/internal/scanner"
)

func main() {
	internalKey := getEnv("INTERNAL_KEY", "dev-secret")
	port := getEnv("PORT", "8080")

	n := notifier.New(internalKey)
	sc := scanner.New(n)
	server := api.NewServer(sc, internalKey)

	log.Printf("[main] verisite scanner starting on :%s", port)

	if err := http.ListenAndServe(":"+port, server.Routes()); err != nil {
		log.Fatalf("[main] server error: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}