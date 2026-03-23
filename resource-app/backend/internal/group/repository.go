package group

import (
	"errors"

	"gorm.io/gorm"
)

var ErrGroupNotFound = errors.New("group not found")

type Repository interface {
	CreateGroup(group *Group) error
	GetGroups() ([]Group, error)
	UpdateGroup(group *Group) error
	DeleteGroup(id string) error
}

type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) CreateGroup(group *Group) error {
	return r.db.Create(group).Error
}

func (r *GormRepository) GetGroups() ([]Group, error) {
	var groups []Group
	result := r.db.Find(&groups)
	return groups, result.Error
}

func (r *GormRepository) UpdateGroup(group *Group) error {
	result := r.db.Model(&Group{}).
        Where("id = ?", group.ID).
        Updates(Group{
            Name:        group.Name,
            Description: group.Description,
        })

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrGroupNotFound
	}

	return nil
}

func (r *GormRepository) DeleteGroup(id string) error {
	result := r.db.Delete(&Group{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrGroupNotFound
	}
	return nil
}