package services

import (
	"pay-slip-app/internal/constants"
	"pay-slip-app/internal/database"
	"pay-slip-app/internal/models"
	"time"

	"github.com/google/uuid"
)

type UserService struct {
	db *database.Database
}

func NewUserService(database *database.Database) *UserService {
	return &UserService{db: database}
}

func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := "SELECT id, email, role, created_at FROM users WHERE email = ?"
	err := s.db.QueryRow(query, email).Scan(&user.ID, &user.Email, &user.Role, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserService) GetUserByID(id string) (*models.User, error) {
	user := &models.User{}
	query := "SELECT id, email, role, created_at FROM users WHERE id = ?"
	err := s.db.QueryRow(query, id).Scan(&user.ID, &user.Email, &user.Role, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserService) CreateUser(email string) (*models.User, error) {
	user := &models.User{
		ID:    uuid.New().String(),
		Email: email,
		Role:  string(constants.RoleUser),
	}
	query := "INSERT INTO users (id, email, role) VALUES (?, ?, ?)"
	if _, err := s.db.Exec(query, user.ID, user.Email, user.Role); err != nil {
		return nil, err
	}
	return s.GetUserByEmail(email)
}

func (s *UserService) GetAllUsers() ([]models.User, error) {
	rows, err := s.db.Query("SELECT id, email, role, created_at FROM users")
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

func (s *UserService) GetUsers(limit int, afterID string, afterCreatedAt *time.Time) ([]models.User, int, error) {
	// 1. Get Total Count
	var total int
	err := s.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 2. Fetch Paginated Data
	query := "SELECT id, email, role, created_at FROM users"
	var args []interface{}

	if afterCreatedAt != nil && afterID != "" {
		query += " WHERE (created_at < ? OR (created_at = ? AND id < ?))"
		args = append(args, afterCreatedAt, afterCreatedAt, afterID)
	}

	query += " ORDER BY created_at DESC, id DESC"

	query += " LIMIT ?"
	args = append(args, limit+1)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Role, &u.CreatedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}

	return users, total, nil
}

func (s *UserService) UpdateUserRole(userID string, role string) error {
	_, err := s.db.Exec("UPDATE users SET role = ? WHERE id = ?", role, userID)
	return err
}
