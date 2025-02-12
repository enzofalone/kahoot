package ws

import (
	"context"
	"fmt"

	"github.com/coder/websocket"
)

// Broadcaster handles WebSocket message broadcasting
type Broadcaster struct {
	logf func(format string, args ...interface{})
}

func NewBroadcaster(logf func(format string, args ...interface{})) *Broadcaster {
	return &Broadcaster{
		logf: logf,
	}
}

// SendToHost sends a message to the host connection
func (b *Broadcaster) SendToHost(hostConn *websocket.Conn, message []byte) error {
	w, err := hostConn.Writer(context.Background(), websocket.MessageText)
	if err != nil {
		return fmt.Errorf("failed to get writer for host: %v", err)
	}
	defer w.Close()

	if _, err := w.Write(message); err != nil {
		return fmt.Errorf("failed to write to host: %v", err)
	}
	return nil
}

// BroadcastToPlayers sends a message to all player connections
func (b *Broadcaster) BroadcastToPlayers(players []*Player, message []byte) error {
	for _, player := range players {
		w, err := player.Conn.Writer(context.Background(), websocket.MessageText)
		if err != nil {
			b.logf("broadcast: failed to get writer for player %s: %v", player.ID, err)
			continue
		}
		defer w.Close()

		if _, err := w.Write(message); err != nil {
			b.logf("broadcast: failed to write to player %s: %v", player.ID, err)
		}
	}
	return nil
}

// BroadcastAll sends a message to both host and players
func (b *Broadcaster) BroadcastAll(hostConn *websocket.Conn, players []*Player, message []byte) error {
	if err := b.SendToHost(hostConn, message); err != nil {
		b.logf("broadcastAll: failed to send to host: %v", err)
	}

	if err := b.BroadcastToPlayers(players, message); err != nil {
		b.logf("broadcastAll: failed to broadcast to players: %v", err)
	}

	return nil
}
