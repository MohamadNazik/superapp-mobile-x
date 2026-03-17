package resource

import (
	"resource-app/internal/shared"

	"gorm.io/gorm"
)

type Repository interface {
	GetResources() ([]Resource, error)
	AddResource(resource *Resource) error
	UpdateResource(resource *Resource) error
	DeleteResource(id string) error
	GetResourceByID(id string) (*Resource, error)
	GetUtilizationStats() ([]ResourceUsageStats, error)
}

type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) GetResources() ([]Resource, error) {
	var resources []Resource
	result := r.db.Find(&resources)
	return resources, result.Error
}

func (r *GormRepository) AddResource(resource *Resource) error {
	return r.db.Create(resource).Error
}

func (r *GormRepository) UpdateResource(resource *Resource) error {
	return r.db.Model(&Resource{}).
		Where("id = ?", resource.ID).
		Updates(resource).Error
}

func (r *GormRepository) DeleteResource(id string) error {
	return r.db.Delete(&Resource{}, "id = ?", id).Error
}

func (r *GormRepository) GetResourceByID(id string) (*Resource, error) {
	var resource Resource
	result := r.db.First(&resource, "id = ?", id)
	return &resource, result.Error
}

type utilizationRow struct {
	ResourceID   string  `gorm:"column:resource_id"`
	ResourceName string  `gorm:"column:resource_name"`
	ResourceType string  `gorm:"column:resource_type"`
	BookingCount int     `gorm:"column:booking_count"`
	TotalHours   float64 `gorm:"column:total_hours"`
}

func (r *GormRepository) GetUtilizationStats() ([]ResourceUsageStats, error) {
	var rows []utilizationRow

	err := r.db.Raw(`
		SELECT
			r.id   AS resource_id,
			r.name AS resource_name,
			r.type AS resource_type,
			COUNT(b.id) AS booking_count,
			COALESCE(SUM(TIMESTAMPDIFF(SECOND, b.start, b.end)), 0) / 3600 AS total_hours
		FROM resources r
		LEFT JOIN bookings b
			ON b.resource_id = r.id AND b.status = ?
		GROUP BY r.id, r.name, r.type
	`, shared.StatusConfirmed).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	stats := make([]ResourceUsageStats, 0, len(rows))
	for _, row := range rows {
		totalHours := int(row.TotalHours)
		utilizationRate := 0
		if totalHours > 0 {
			utilizationRate = int((float64(totalHours) / 160.0) * 100.0)
			if utilizationRate > 100 {
				utilizationRate = 100
			}
		}
		stats = append(stats, ResourceUsageStats{
			ResourceID:      row.ResourceID,
			ResourceName:    row.ResourceName,
			ResourceType:    row.ResourceType,
			BookingCount:    row.BookingCount,
			TotalHours:      totalHours,
			UtilizationRate: utilizationRate,
		})
	}

	return stats, nil
}
