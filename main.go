package main

import (
	"context"
	"embed"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/getlantern/systray"
)

//go:embed web
var content embed.FS

//go:embed res/sat-icon.png
var icon []byte

func main() {
	port := "8080"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}

	server := &http.Server{Addr: ":" + port, Handler: http.FileServer(http.FS(content))}
	openPage := exec.Command("xdg-open", "http://localhost:8080/web/grid-three.html").Start

	go func() {
		log.Printf("Starting server on :%s", port)
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			if strings.Contains(err.Error(), "address already in use") {
				openPage() // Assume the server is already running.
			}

			log.Fatalf("HTTP server ListenAndServe: %v", err)
		}
	}()

	openPage()
	systray.Run(systraySetup(server), systrayExit)
}

func systraySetup(server *http.Server) func() {
	return func() {
		systray.SetIcon(icon)
		systray.SetTitle("Ainulindalë")
		systray.SetTooltip("Ainulindalë terrain generator server")

		mQuit := systray.AddMenuItem("Quit", "Close the server")

		go func() {
			<-mQuit.ClickedCh
			log.Println("Quit button clicked, stopping server")
			ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
			defer cancel()
			if err := server.Shutdown(ctx); err != nil {
				log.Fatalf("Server Shutdown Failed:%+v", err)
			}
			log.Println("Server stopped")
			systray.Quit()
		}()
	}
}

func systrayExit() {
	log.Println("Exiting application")
}
