package group

import "time"

type Group struct {
	ID          string    `json:"id" gorm:"type:varchar(36);primaryKey"`
	Name        string    `json:"name" binding:"required" gorm:"type:varchar(100);not null"`
	Description string    `json:"description" gorm:"type:text"`
	CreatedAt   time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

type CreateAndUpdateGroupPayload struct {
    Name        string `json:"name" binding:"required"`
    Description string `json:"description"`
}