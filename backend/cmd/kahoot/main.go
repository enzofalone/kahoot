package main

import (
	"context"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/enzofalone/kahoot/internal/repo"
	"github.com/enzofalone/kahoot/internal/ws"
)

func main() {
	log.SetFlags(0)

	err := run()
	if err != nil {
		log.Fatal(err)
	}
}

// run starts a http.Server for the passed in address
// with all requests handled by echoServer.
func run() error {
	if len(os.Args) < 2 {
		return errors.New("please provide an address to listen on as the first argument")
	}

	log.Printf("connecting to database")
	db := repo.NewDatabase("./db.sqlite", 10)

	l, err := net.Listen("tcp", os.Args[1])
	if err != nil {
		return err
	}
	log.Printf("listening on ws://%v", l.Addr())

	// TODO: temporary thing, use redis or something better
	rooms := make(map[string]*ws.Room)

	playerHandler := ws.NewPlayerHandler(log.Printf, rooms)
	hostHandler := ws.NewHostHandler(log.Printf, db, rooms)

	mux := http.NewServeMux()
	mux.HandleFunc("/host", hostHandler.ServeHTTP)
	mux.HandleFunc("/player", playerHandler.ServeHTTP)

	s := http.Server{
		Handler: mux,
	}

	errc := make(chan error, 1)
	go func() {
		errc <- s.Serve(l)
	}()

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, os.Interrupt)

	select {
	case err := <-errc:
		log.Printf("failed to serve: %v", err)
	case sig := <-sigs:
		log.Printf("terminating: %v", sig)
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	return s.Shutdown(ctx)
}
