// internal/db/db.go
package db

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"pay-slip-app/internal/constants"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type Database struct {
	Conn *sql.DB
	mu   sync.Mutex
}

// NewDatabase creates a new database connection with pool tuning and a background health pinger.
func NewDatabase() (*Database, error) {
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&multiStatements=true", dbUser, dbPassword, dbHost, dbPort, dbName)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	db.SetConnMaxLifetime(time.Duration(constants.ConnMaxLifetimeMinutes) * time.Minute)
	db.SetMaxIdleConns(constants.MaxIdleConns)
	db.SetMaxOpenConns(constants.MaxOpenConns)

	if err := db.Ping(); err != nil {
		return nil, err
	}

	d := &Database{Conn: db}
	log.Println("Database connection established")

	// Background pinger — keeps connections alive, auto-reconnects on repeated failures.
	go func(dsn string, database *Database) {
		ticker := time.NewTicker(time.Duration(constants.PingIntervalSeconds) * time.Second)
		defer ticker.Stop()
		failCount := 0
		for range ticker.C {
			database.mu.Lock()
			err := database.Conn.Ping()
			database.mu.Unlock()
			if err != nil {
				log.Printf("DB ping failed: %v", err)
				failCount++
			} else {
				failCount = 0
				continue
			}

			if failCount >= constants.ReconnectFailThreshold {
				log.Println("Attempting DB reconnect after repeated ping failures")
				newDB, err := sql.Open("mysql", dsn)
				if err != nil {
					log.Printf("reconnect: sql.Open error: %v", err)
					continue
				}
				newDB.SetConnMaxLifetime(time.Duration(constants.ConnMaxLifetimeMinutes) * time.Minute)
				newDB.SetMaxIdleConns(constants.MaxIdleConns)
				newDB.SetMaxOpenConns(constants.MaxOpenConns)
				if err := newDB.Ping(); err != nil {
					log.Printf("reconnect: ping failed: %v", err)
					_ = newDB.Close()
					continue
				}

				database.mu.Lock()
				old := database.Conn
				database.Conn = newDB
				database.mu.Unlock()
				_ = old.Close()
				log.Println("DB reconnect successful")
				failCount = 0
			}
		}
	}(dsn, d)

	return d, nil
}

// Migrate runs the SQL migration file.
func (db *Database) Migrate() error {
	query, err := ioutil.ReadFile("migrations/001_initial.sql")
	if err != nil {
		return fmt.Errorf("could not read migration file: %w", err)
	}
	if _, err := db.Conn.Exec(string(query)); err != nil {
		return fmt.Errorf("could not apply migration: %w", err)
	}
	log.Println("Database migration applied successfully")
	return nil
}

// ── Database Methods ───────────────────────────────────────────────────────
// (Database methods have been moved to internal/services)

