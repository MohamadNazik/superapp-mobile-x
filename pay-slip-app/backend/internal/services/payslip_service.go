package services

import (
	"database/sql"
	"pay-slip-app/internal/database"
	"pay-slip-app/internal/models"
	"time"

	"github.com/google/uuid"
)

type PaySlipService struct {
	db *database.Database
}

func NewPaySlipService(db *database.Database) *PaySlipService {
	return &PaySlipService{db: db}
}

func (s *PaySlipService) InsertPaySlip(ps *models.PaySlip) error {
	if ps.ID == "" {
		ps.ID = uuid.New().String()
	}
	now := time.Now()
	if ps.CreatedAt.IsZero() {
		ps.CreatedAt = now
	}
	if ps.UpdatedAt.IsZero() {
		ps.UpdatedAt = now
	}
	query := `INSERT INTO pay_slips (id, user_id, user_email, month, year, file_url, uploaded_by, created_at, updated_at) 
	          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := s.db.Conn.Exec(query, ps.ID, ps.UserID, ps.UserEmail, ps.Month, ps.Year, ps.FileURL, ps.UploadedBy, ps.CreatedAt, ps.UpdatedAt)
	return err
}

func (s *PaySlipService) UpdatePaySlipFile(id, fileURL, uploadedBy string) error {
	query := "UPDATE pay_slips SET file_url = ?, uploaded_by = ?, updated_at = ? WHERE id = ?"
	_, err := s.db.Conn.Exec(query, fileURL, uploadedBy, time.Now(), id)
	return err
}

func (s *PaySlipService) DeletePaySlip(id string) error {
	_, err := s.db.Conn.Exec("DELETE FROM pay_slips WHERE id = ?", id)
	return err
}

func (s *PaySlipService) GetPaySlipByID(id string) (*models.PaySlip, error) {
	ps := &models.PaySlip{}
	query := "SELECT id, user_id, user_email, month, year, file_url, uploaded_by, created_at, updated_at FROM pay_slips WHERE id = ?"
	err := s.db.Conn.QueryRow(query, id).Scan(&ps.ID, &ps.UserID, &ps.UserEmail, &ps.Month, &ps.Year, &ps.FileURL, &ps.UploadedBy, &ps.CreatedAt, &ps.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return ps, nil
}

func (s *PaySlipService) GetPaySlipByUserMonthYear(userID string, month, year int) (*models.PaySlip, error) {
	ps := &models.PaySlip{}
	query := "SELECT id, user_id, user_email, month, year, file_url, uploaded_by, created_at, updated_at FROM pay_slips WHERE user_id = ? AND month = ? AND year = ?"
	err := s.db.Conn.QueryRow(query, userID, month, year).Scan(&ps.ID, &ps.UserID, &ps.UserEmail, &ps.Month, &ps.Year, &ps.FileURL, &ps.UploadedBy, &ps.CreatedAt, &ps.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return ps, nil
}

func (s *PaySlipService) GetPaySlips(userID string, isAdmin bool) ([]models.PaySlip, int, error) {
	var query string
	var args []interface{}

	if isAdmin {
		query = "SELECT id, user_id, user_email, month, year, file_url, uploaded_by, created_at, updated_at FROM pay_slips ORDER BY created_at DESC"
	} else {
		query = "SELECT id, user_id, user_email, month, year, file_url, uploaded_by, created_at, updated_at FROM pay_slips WHERE user_id = ? ORDER BY created_at DESC"
		args = append(args, userID)
	}

	rows, err := s.db.Conn.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	slips := make([]models.PaySlip, 0)
	for rows.Next() {
		var ps models.PaySlip
		if err := rows.Scan(&ps.ID, &ps.UserID, &ps.UserEmail, &ps.Month, &ps.Year, &ps.FileURL, &ps.UploadedBy, &ps.CreatedAt, &ps.UpdatedAt); err != nil {
			return nil, 0, err
		}
		slips = append(slips, ps)
	}

	total := len(slips)
	return slips, total, nil
}
