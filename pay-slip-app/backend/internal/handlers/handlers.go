// internal/handlers/handlers.go
package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"pay-slip-app/internal/constants"
	"pay-slip-app/internal/models"
	"pay-slip-app/internal/services"
	"pay-slip-app/internal/storage"
	"strconv"
	"strings"
	"time"
)

type Handler struct {
	UserService    *services.UserService
	PaySlipService *services.PaySlipService
	Storage        *storage.FirebaseStorage
}

func New(userService *services.UserService, paySlipService *services.PaySlipService, storage *storage.FirebaseStorage) *Handler {
	return &Handler{
		UserService:    userService,
		PaySlipService: paySlipService,
		Storage:        storage,
	}
}


// ── helpers ───────────────────────────────────────────────────────────────────

func mustGetUser(r *http.Request) *models.User {
	val := r.Context().Value(constants.ContextUserKey)
	if val == nil {
		return nil
	}
	return val.(*models.User)
}

func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *Handler) parsePagination(r *http.Request) (int, string, *time.Time, error) {
	limitStr := r.URL.Query().Get("limit")
	cursorStr := r.URL.Query().Get("cursor")

	var limit int
	if limitStr != "" {
		var err error
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			return 0, "", nil, fmt.Errorf("Invalid 'limit' parameter: must be an integer")
		}
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}

	var afterID string
	var afterCreatedAt *time.Time

	if cursorStr != "" {
		decoded, err := base64.StdEncoding.DecodeString(cursorStr)
		if err != nil {
			return 0, "", nil, fmt.Errorf("invalid 'cursor' parameter: not a valid base64 string")
		}

		parts := strings.Split(string(decoded), "|")
		if len(parts) != 2 {
			return 0, "", nil, fmt.Errorf("invalid 'cursor' parameter: incorrect format")
		}

		ts, err := time.Parse(time.RFC3339, parts[0])
		if err != nil {
			return 0, "", nil, fmt.Errorf("invalid 'cursor' parameter: invalid timestamp")
		}

		afterCreatedAt = &ts
		afterID = parts[1]
	}
	return limit, afterID, afterCreatedAt, nil
}

