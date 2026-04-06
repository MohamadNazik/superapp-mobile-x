package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"pay-slip-app/internal/constants"
	"pay-slip-app/internal/file"
	"pay-slip-app/internal/models"
	"pay-slip-app/internal/utils"
	"strconv"
)

// ── PaySlip handlers ──────────────────────────────────────────────────────────

// UploadFile handles POST /api/upload [admin only]
func (h *PaySlipHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	if currentUser.Role != models.UserRoleAdmin {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Enforce max upload size (10MB)
	r.Body = http.MaxBytesReader(w, r.Body, int64(constants.MaxUploadSizeMB)<<20)

	multipartFile, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file is required and must be under 10MB", http.StatusBadRequest)
		return
	}
	defer multipartFile.Close()

	// Use our dedicated file validator for security checks
	contentType, err := file.ValidatePaySlipFile(header.Filename, multipartFile)
	if err != nil {
		http.Error(w, fmt.Sprintf("%v. Allowed extensions: %s", err, strings.Join(file.GetAllowedExtensions(), ", ")), http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	path, err := h.PaySlipService.UploadFile(ctx, multipartFile, header.Filename, contentType)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to upload to storage: %v", err), http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"filePath": path})
}

// CreatePaySlip handles POST /api/pay-slips  [admin only]
func (h *PaySlipHandler) CreatePaySlip(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	if currentUser.Role != models.UserRoleAdmin {
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

	// 1. Check for existing record to handle orphaned files later if this is an update
	existing, err := h.PaySlipService.GetPaySlipByUserMonthYear(req.UserID, req.Month, req.Year)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	var oldFilePath string
	if existing != nil {
		oldFilePath = existing.FilePath
	}

	// 2. Atomic Upsert using the new service method
	ps := &models.PaySlip{
		UserID:     req.UserID,
		UserEmail:  userEmail,
		Month:      req.Month,
		Year:       req.Year,
		FilePath:   req.FilePath,
		UploadedBy: currentUser.ID,
	}

	result, created, err := h.PaySlipService.UpsertPaySlip(ps)
	if err != nil {
		http.Error(w, "Failed to save pay slip", http.StatusInternalServerError)
		return
	}

	// 3. Clean up orphaned file if this was an update and the file path changed
	if !created && oldFilePath != "" && oldFilePath != result.FilePath {
		// We log the error but don't fail the request since the DB update was successful
		if err := h.PaySlipService.DeleteFile(r.Context(), oldFilePath); err != nil {
			fmt.Printf("Warning: failed to delete orphaned file %q: %v\n", oldFilePath, err)
		}
	}

	statusCode := http.StatusOK
	if created {
		statusCode = http.StatusCreated
	}
	jsonResponse(w, statusCode, result)
}

// GetMyPaySlips handles GET /api/pay-slips - Returns only the caller's own pay slips
func (h *PaySlipHandler) GetMyPaySlips(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	limit, afterID, afterCreatedAt, err := utils.ParsePagination(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	slips, total, err := h.PaySlipService.GetPaySlipsByUserID(currentUser.ID, limit, afterID, afterCreatedAt)
	if err != nil {
		http.Error(w, "Failed to get pay slips", http.StatusInternalServerError)
		return
	}

	h.respondWithPaySlips(w, slips, total, limit)
}

// GetAllPaySlips handles GET /api/pay-slips/all [admin only]
func (h *PaySlipHandler) GetAllPaySlips(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	if currentUser.Role != models.UserRoleAdmin {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	limit, afterID, afterCreatedAt, err := utils.ParsePagination(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 2. Parse Filtering Params
	userID := r.URL.Query().Get("userId")
	yearStr := r.URL.Query().Get("year")
	monthStr := r.URL.Query().Get("month")

	var year, month int
	if yearStr != "" {
		var err error
		year, err = strconv.Atoi(yearStr)
		if err != nil {
			http.Error(w, "Invalid year parameter: must be an integer", http.StatusBadRequest)
			return
		}
	}
	if monthStr != "" {
		var err error
		month, err = strconv.Atoi(monthStr)
		if err != nil || month < 1 || month > 12 {
			http.Error(w, "Invalid month parameter: must be between 1 and 12", http.StatusBadRequest)
			return
		}
	}

	slips, total, err := h.PaySlipService.GetPaySlips(limit, afterID, afterCreatedAt, userID, month, year)
	if err != nil {
		http.Error(w, "Failed to get pay slips", http.StatusInternalServerError)
		return
	}

	h.respondWithPaySlips(w, slips, total, limit)
}

// GetPaySlipByID handles GET /api/pay-slips/{id}
func (h *PaySlipHandler) GetPaySlipByID(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ps, err := h.PaySlipService.GetPaySlipByID(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Pay slip not found", http.StatusNotFound)
		return
	}

	if currentUser.Role != models.UserRoleAdmin && ps.UserID != currentUser.ID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Generate fresh signed URL for the explicitly requested file
	if signedURL, err := h.PaySlipService.GetSignedURL(ps.FilePath); err == nil {
		ps.SignedURL = signedURL
		ps.FilePath = "" // No need to return both in single fetch, per latest review
	}

	jsonResponse(w, http.StatusOK, ps)
}

// DeletePaySlip handles DELETE /api/pay-slips/{id}  [admin only]
func (h *PaySlipHandler) DeletePaySlip(w http.ResponseWriter, r *http.Request) {
	currentUser := mustGetUser(r)
	if currentUser == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	if currentUser.Role != models.UserRoleAdmin {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	if err := h.PaySlipService.DeletePaySlip(r.Context(), r.PathValue("id")); err != nil {
		http.Error(w, "Failed to delete pay slip", http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "Pay slip deleted successfully"})
}

// ── Private Helpers ──────────────────────────────────────────────────────────


func (h *PaySlipHandler) respondWithPaySlips(w http.ResponseWriter, slips []models.PaySlip, total int, limit int) {
	data := slips
	var nextCursor *string
	if limit > 0 && len(slips) > limit {
		data = slips[:limit]
		last := data[limit-1]
		nextCursor = utils.EncodeCursor(last.CreatedAt, last.ID)
	}

	jsonResponse(w, http.StatusOK, models.PaySlipsResponse{
		Data:       data,
		Total:      total,
		NextCursor: nextCursor,
	})
}
