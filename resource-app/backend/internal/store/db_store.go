package store

import (
	"gorm.io/gorm"
	"resource-app/internal/resource"
	"resource-app/internal/booking"
)

// DBStore handles database operations
type DBStore struct {
	db *gorm.DB
}

// NewDBStore creates a new DBStore
func NewDBStore(db *gorm.DB) *DBStore {
	return &DBStore{db: db}
}

// --- Stats ---

type ResourceUsageStats struct {
	ResourceID      string `json:"resourceId"`
	ResourceName    string `json:"resourceName"`
	ResourceType    string `json:"resourceType"`
	BookingCount    int    `json:"bookingCount"`
	TotalHours      int    `json:"totalHours"`
	UtilizationRate int    `json:"utilizationRate"`
}

func (s *DBStore) GetUtilizationStats() ([]ResourceUsageStats, error) {
	// This is a simplified implementation. In a real app, you'd likely do this with a complex SQL query.
	// For now, we'll fetch resources and bookings and calculate in memory to match the mock implementation.
	
	resourceRepo := resource.NewGormRepository(s.db)
	resources, err := resourceRepo.GetResources()
	if err != nil {
		return nil, err
	}

	var stats []ResourceUsageStats

	for _, res := range resources {
		var bookings []booking.Booking
		s.db.Where("resource_id = ? AND status = ?", res.ID, booking.StatusConfirmed).Find(&bookings)

		totalMs := int64(0)
		for _, b := range bookings {
			totalMs += b.End.Sub(b.Start).Milliseconds()
		}
		totalHours := int(totalMs / (1000 * 60 * 60))
		utilizationRate := 0
		if totalHours > 0 {
			utilizationRate = int((float64(totalHours) / 160.0) * 100.0) // Assumes 160h monthly capacity
			if utilizationRate > 100 {
				utilizationRate = 100
			}
		}

		stats = append(stats, ResourceUsageStats{
			ResourceID:      res.ID,
			ResourceName:    res.Name,
			ResourceType:    res.Type,
			BookingCount:    len(bookings),
			TotalHours:      totalHours,
			UtilizationRate: utilizationRate,
		})
	}

	return stats, nil
}