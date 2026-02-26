// internal/handlers/handlers.go
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"pay-slip-app/internal/constants"
	"pay-slip-app/internal/db"
	"pay-slip-app/internal/models"
	"pay-slip-app/internal/storage"
	"time"
)

type Handler struct {
	DB      *db.Database
	Storage *storage.FirebaseStorage
}

func New(database *db.Database, storage *storage.FirebaseStorage) *Handler {
	return &Handler{DB: database, Storage: storage}
}

// ── User handlers ─────────────────────────────────────────────────────────────

// GetCurrentUser handles GET /api/me
func (h *Handler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	user := mustGetUser(r)
	if user == nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}
	jsonResponse(w, http.StatusOK, user)
}

// GetUsers handles GET /api/users  [admin only]
func (h *Handler) GetUsers(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}
	if currentUser.Role != string(constants.RoleAdmin) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	users, err := h.DB.GetAllUsers()
	if err != nil {
		http.Error(w, "Failed to get users", http.StatusInternalServerError)
		return
	}
	jsonResponse(w, http.StatusOK, users)
}

// UpdateUserRole handles PUT /api/users/{id}/role  [admin only]
func (h *Handler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}
	if currentUser.Role != string(constants.RoleAdmin) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	userID := r.PathValue("id")
	var req models.UpdateUserRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := h.DB.UpdateUserRole(userID, req.Role); err != nil {
		http.Error(w, "Failed to update user role", http.StatusInternalServerError)
		return
	}
	jsonResponse(w, http.StatusOK, map[string]string{"message": "User role updated successfully"})
}

// ── PaySlip handlers ──────────────────────────────────────────────────────────

// UploadFile handles POST /api/upload [admin only]
func (h *Handler) UploadFile(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}
	if currentUser.Role != string(constants.RoleAdmin) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Enforce max upload size (10MB)
	r.Body = http.MaxBytesReader(w, r.Body, int64(constants.MaxUploadSizeMB)<<20)

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file is required and must be under 10MB", http.StatusBadRequest)
		return
	}
	defer file.Close()

	ctx := r.Context()
	url, err := h.Storage.UploadFile(ctx, file, header.Filename)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to upload to storage: %v", err), http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"fileUrl": url})
}

// CreatePaySlip handles POST /api/pay-slips  [admin only]
func (h *Handler) CreatePaySlip(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}
	if currentUser.Role != string(constants.RoleAdmin) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req models.CreatePaySlipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Resolve the target user's email
	allUsers, err := h.DB.GetAllUsers()
	if err != nil {
		http.Error(w, "Failed to look up users", http.StatusInternalServerError)
		return
	}
	userEmail := ""
	for _, u := range allUsers {
		if u.ID == req.UserID {
			userEmail = u.Email
			break
		}
	}
	if userEmail == "" {
		http.Error(w, "userId not found", http.StatusBadRequest)
		return
	}

	// Upsert logic
	existing, err := h.DB.GetPaySlipByUserMonthYear(req.UserID, req.Month, req.Year)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if existing != nil {
		if err := h.DB.UpdatePaySlipFile(existing.ID, req.FileURL, currentUser.ID); err != nil {
			http.Error(w, "Failed to update pay slip", http.StatusInternalServerError)
			return
		}
		updated, _ := h.DB.GetPaySlipByID(existing.ID)
		jsonResponse(w, http.StatusOK, updated)
		return
	}

	ps := &models.PaySlip{
		UserID:     req.UserID,
		UserEmail:  userEmail,
		Month:      req.Month,
		Year:       req.Year,
		FileURL:    req.FileURL,
		UploadedBy: currentUser.ID,
		CreatedAt:  time.Now(),
	}
	if err := h.DB.InsertPaySlip(ps); err != nil {
		http.Error(w, "Failed to save pay slip", http.StatusInternalServerError)
		return
	}
	jsonResponse(w, http.StatusCreated, ps)
}

// GetPaySlips handles GET /api/pay-slips
func (h *Handler) GetPaySlips(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}

	isAdmin := currentUser.Role == string(constants.RoleAdmin)

	slips, total, err := h.DB.GetPaySlips(currentUser.ID, isAdmin)
	if err != nil {
		http.Error(w, "Failed to get pay slips", http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, models.PaySlipsResponse{
		Data:  slips,
		Total: total,
	})
}

// GetPaySlipByID handles GET /api/pay-slips/{id}
func (h *Handler) GetPaySlipByID(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}

	ps, err := h.DB.GetPaySlipByID(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Pay slip not found", http.StatusNotFound)
		return
	}

	if currentUser.Role != string(constants.RoleAdmin) && ps.UserID != currentUser.ID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	jsonResponse(w, http.StatusOK, ps)
}

// DeletePaySlip handles DELETE /api/pay-slips/{id}  [admin only]
func (h *Handler) DeletePaySlip(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}
	if currentUser.Role != string(constants.RoleAdmin) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	id := r.PathValue("id")
	if _, err := h.DB.GetPaySlipByID(id); err != nil {
		http.Error(w, "Pay slip not found", http.StatusNotFound)
		return
	}

	if err := h.DB.DeletePaySlip(id); err != nil {
		http.Error(w, "Failed to delete pay slip", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
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
