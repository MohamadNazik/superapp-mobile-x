package booking

import (
	"encoding/json"
	"time"
)

// Booking represents a reservation of a resource
type Booking struct {
	ID              string          `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ResourceID      string          `json:"resourceId" gorm:"index;type:varchar(36);not null"`
	UserID          string          `json:"userId" gorm:"index;type:varchar(36);not null"`
	Start           time.Time       `json:"start" gorm:"not null"`
	End             time.Time       `json:"end" gorm:"not null"`
	Status          BookingStatus   `json:"status" gorm:"index;type:varchar(20);default:'pending'"`
	CreatedAt       time.Time       `json:"createdAt" gorm:"autoCreateTime"`
	RejectionReason *string         `json:"rejectionReason,omitempty" gorm:"type:text"`
	Details         json.RawMessage `json:"details" gorm:"type:json"` // Stored as JSON
}