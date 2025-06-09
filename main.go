package main

import (
	"embed"
	"log"
	"net/http"
	"os"
	"os/exec"
)

//go:embed web
var content embed.FS

func main() {
	port := "8080"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}

	http.Handle("/", http.FileServer(http.FS(content)))
	exec.Command("xdg-open", "localhost:8080/web/grid-three.html").Start()
	log.Printf("Starting server on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
