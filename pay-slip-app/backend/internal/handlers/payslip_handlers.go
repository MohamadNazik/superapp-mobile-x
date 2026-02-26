package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"pay-slip-app/internal/constants"
	"pay-slip-app/internal/models"
	"time"
)

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

	if err := req.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Resolve the target user's email
	targetUser, err := h.UserService.GetUserByID(req.UserID)
	if err != nil {
		http.Error(w, "userId not found", http.StatusBadRequest)
		return
	}
	userEmail := targetUser.Email

	// Upsert logic
	existing, err := h.PaySlipService.GetPaySlipByUserMonthYear(req.UserID, req.Month, req.Year)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if existing != nil {
		if err := h.PaySlipService.UpdatePaySlipFile(existing.ID, req.FileURL, currentUser.ID); err != nil {
			http.Error(w, "Failed to update pay slip", http.StatusInternalServerError)
			return
		}
		updated, _ := h.PaySlipService.GetPaySlipByID(existing.ID)
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
	if err := h.PaySlipService.InsertPaySlip(ps); err != nil {
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

	slips, total, err := h.PaySlipService.GetPaySlips(currentUser.ID, isAdmin)
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

	ps, err := h.PaySlipService.GetPaySlipByID(r.PathValue("id"))
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
	if _, err := h.PaySlipService.GetPaySlipByID(id); err != nil {
		http.Error(w, "Pay slip not found", http.StatusNotFound)
		return
	}

	if err := h.PaySlipService.DeletePaySlip(id); err != nil {
		http.Error(w, "Failed to delete pay slip", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
