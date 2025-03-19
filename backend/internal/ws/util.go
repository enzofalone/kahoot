package ws

import "strings"

func sanitizeRoomCode(c string) string {
	c = strings.ToLower(c)
	c = strings.ReplaceAll(c, " ", "")

	return c
}
