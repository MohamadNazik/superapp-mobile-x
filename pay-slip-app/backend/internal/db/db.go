// internal/db/db.go
package db

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"pay-slip-app/internal/constants"
	"pay-slip-app/internal/models"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
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

// ── User methods (pay slips are in Firestore — see internal/store) ────────────

func (db *Database) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := "SELECT id, email, role, created_at FROM users WHERE email = ?"
	err := db.Conn.QueryRow(query, email).Scan(&user.ID, &user.Email, &user.Role, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (db *Database) CreateUser(email string) (*models.User, error) {
	user := &models.User{
		ID:    uuid.New().String(),
		Email: email,
		Role:  "user",
	}
	query := "INSERT INTO users (id, email, role) VALUES (?, ?, ?)"
	if _, err := db.Conn.Exec(query, user.ID, user.Email, user.Role); err != nil {
		return nil, err
	}
	return db.GetUserByEmail(email)
}

func (db *Database) GetAllUsers() ([]models.User, error) {
	rows, err := db.Conn.Query("SELECT id, email, role, created_at FROM users")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Role, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (db *Database) UpdateUserRole(userID string, role string) error {
	_, err := db.Conn.Exec("UPDATE users SET role = ? WHERE id = ?", role, userID)
	return err
}

// ── Pay Slip methods ─────────────────────────────────────────────────────────

func (db *Database) InsertPaySlip(ps *models.PaySlip) error {
	if ps.ID == "" {
		ps.ID = uuid.New().String()
	}
	if ps.CreatedAt.IsZero() {
		ps.CreatedAt = time.Now()
	}
	query := `INSERT INTO pay_slips (id, user_id, user_email, month, year, file_url, uploaded_by, created_at) 
	          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := db.Conn.Exec(query, ps.ID, ps.UserID, ps.UserEmail, ps.Month, ps.Year, ps.FileURL, ps.UploadedBy, ps.CreatedAt)
	return err
}

func (db *Database) UpdatePaySlipFile(id, fileURL, uploadedBy string) error {
	query := "UPDATE pay_slips SET file_url = ?, uploaded_by = ?, created_at = ? WHERE id = ?"
	_, err := db.Conn.Exec(query, fileURL, uploadedBy, time.Now(), id)
	return err
}

func (db *Database) DeletePaySlip(id string) error {
	_, err := db.Conn.Exec("DELETE FROM pay_slips WHERE id = ?", id)
	return err
}

func (db *Database) GetPaySlipByID(id string) (*models.PaySlip, error) {
	ps := &models.PaySlip{}
	query := "SELECT id, user_id, user_email, month, year, file_url, uploaded_by, created_at FROM pay_slips WHERE id = ?"
	err := db.Conn.QueryRow(query, id).Scan(&ps.ID, &ps.UserID, &ps.UserEmail, &ps.Month, &ps.Year, &ps.FileURL, &ps.UploadedBy, &ps.CreatedAt)
	if err != nil {
		return nil, err
	}
	return ps, nil
}

func (db *Database) GetPaySlipByUserMonthYear(userID string, month, year int) (*models.PaySlip, error) {
	ps := &models.PaySlip{}
	query := "SELECT id, user_id, user_email, month, year, file_url, uploaded_by, created_at FROM pay_slips WHERE user_id = ? AND month = ? AND year = ?"
	err := db.Conn.QueryRow(query, userID, month, year).Scan(&ps.ID, &ps.UserID, &ps.UserEmail, &ps.Month, &ps.Year, &ps.FileURL, &ps.UploadedBy, &ps.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return ps, nil
}

// GetPaySlips returns a list of pay slips and the total count.
func (db *Database) GetPaySlips(userID string, isAdmin bool) ([]models.PaySlip, int, error) {
	var query string
	var args []interface{}

	if isAdmin {
		query = "SELECT id, user_id, user_email, month, year, file_url, uploaded_by, created_at FROM pay_slips ORDER BY created_at DESC"
	} else {
		query = "SELECT id, user_id, user_email, month, year, file_url, uploaded_by, created_at FROM pay_slips WHERE user_id = ? ORDER BY created_at DESC"
		args = append(args, userID)
	}

	rows, err := db.Conn.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	slips := make([]models.PaySlip, 0)
	for rows.Next() {
		var ps models.PaySlip
		if err := rows.Scan(&ps.ID, &ps.UserID, &ps.UserEmail, &ps.Month, &ps.Year, &ps.FileURL, &ps.UploadedBy, &ps.CreatedAt); err != nil {
			return nil, 0, err
		}
		slips = append(slips, ps)
	}

	total := len(slips)
	return slips, total, nil
}
