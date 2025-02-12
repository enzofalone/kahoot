package repo

import (
	"context"

	"github.com/jackc/pgx/v5"
)

const schema = `
	CREATE TABLE bank (
		id SERIAL PRIMARY KEY,
		title TEXT NOT NULL
	)

	CREATE TABLE question (
		bank_id	INTEGER,
		prompt TEXT NOT NULL,
		answer_bank TEXT[],
		next_question INTEGER,
		FOREIGN KEY (bank_id) REFERENCES bank(id) ON DELETE CASCADE,
		FOREIGN KEY (next_question) REFERENCES question(id)
	)
`

type Database struct {
	*pgx.Conn
	url                string
	maxOpenConnections int
}

func NewDatabase(url string, maxOpenConnections int) *Database {
	db := &Database{
		url:                url,
		maxOpenConnections: maxOpenConnections,
	}
	return db
}

// Connect to a database at Database.url
// If database file does not exist, a new db file will be created at Database.url
func (db *Database) Connect(ctx context.Context) error {
	var err error

	db.Conn, err = pgx.Connect(context.Background(), db.url)
	if err != nil {
		return err
	}
	defer db.Close(context.Background())

	return nil
}

// CreateTables creates and executes database schema defined
func (db *Database) CreateTables() error {
	if _, err := db.Exec(context.Background(), schema); err != nil {
		return err
	}
	return nil
}

// PingTable checks if database schema has been created by pinging bank table
func (db *Database) PingTable() (bool, error) {
	var tableExists bool
	if err := db.QueryRow(context.Background(), `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bank');`).Scan(&tableExists); err != nil {
		return false, err
	}

	return tableExists, nil
}
