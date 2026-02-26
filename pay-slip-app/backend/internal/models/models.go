// internal/models/models.go
package models

import "time"

// User represents an authenticated employee in the system.
type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"-"`
}

// PaySlip represents a single pay slip record stored in Firestore.
// FileURL is a Firebase Storage download URL uploaded directly by the frontend.
type PaySlip struct {
	ID         string    `json:"id"`
	UserID     string    `json:"userId"`
	UserEmail  string    `json:"userEmail,omitempty"`
	Month      int       `json:"month"`
	Year       int       `json:"year"`
	FileURL    string    `json:"fileUrl"`   // Firebase Storage download URL
	UploadedBy string    `json:"uploadedBy"`
	CreatedAt  time.Time `json:"createdAt"`
}

// PaySlipsResponse is the unified response for GET /api/pay-slips.
// Admin receives all employees' slips; users receive only their own.
// Both use the same wrapper shape.
type PaySlipsResponse struct {
	Data  []PaySlip `json:"data"`
	Total int       `json:"total"`
}

// CreatePaySlipRequest is the JSON body for POST /api/pay-slips.
// The frontend uploads the file directly to Firebase Storage and sends back the download URL.
type CreatePaySlipRequest struct {
	UserID  string `json:"userId"  binding:"required"`
	Month   int    `json:"month"   binding:"required,min=1,max=12"`
	Year    int    `json:"year"    binding:"required"`
	FileURL string `json:"fileUrl" binding:"required"`
}

// UpdateUserRoleRequest is used by PUT /api/users/:id/role.
type UpdateUserRoleRequest struct {
	Role string `json:"role" binding:"required"`
}
