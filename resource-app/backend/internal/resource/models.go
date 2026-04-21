package resource

import (
	"encoding/json"
	"time"
)

type Resource struct {
	ID               string          `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name             string          `json:"name" gorm:"column:name;type:varchar(100);unique;not null"`
	Type             string          `json:"type" gorm:"type:varchar(50);not null"`
	Description      string          `json:"description" gorm:"type:text"`
	IsActive         bool            `json:"isActive" gorm:"default:true"`
	MinLeadTimeHours int             `json:"minLeadTimeHours" gorm:"default:0"`
	Icon             string          `json:"icon" gorm:"type:varchar(50)"`
	Color            string          `json:"color" gorm:"type:varchar(20)"`
	Specs            json.RawMessage `json:"specs" gorm:"type:json"`      // Stored as JSON
	FormFields       json.RawMessage `json:"formFields" gorm:"type:json"` // Stored as JSON
	CreatedAt        time.Time       `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt        time.Time       `json:"updatedAt" gorm:"autoUpdateTime"`
}

// ResourceListItem extends Resource with per-user requestability metadata.
type ResourceListItem struct {
	Resource
	CanBook bool `json:"canBook" gorm:"column:can_book"`
}
