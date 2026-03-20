package permission

import (
	"strings"

	mysqlDriver "github.com/go-sql-driver/mysql"
	"gorm.io/gorm"
)

type Repository interface {
	CreatePermission(permission *ResourcePermission) error
	UpdatePermissionType(id string, permissionType PermissionType) (*ResourcePermission, error)
	DeletePermission(id string) error
	GetPermissionsByGroupID(groupID string) ([]GroupPermissionResult, error)
}

type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) CreatePermission(permission *ResourcePermission) error {
	var resourceCount int64
	if err := r.db.Table("resources").Where("id = ?", permission.ResourceID).Count(&resourceCount).Error; err != nil {
		return err
	}
	if resourceCount == 0 {
		return ErrResourceNotFound
	}

	var groupCount int64
	if err := r.db.Table("groups").Where("id = ?", permission.GroupID).Count(&groupCount).Error; err != nil {
		return err
	}
	if groupCount == 0 {
		return ErrGroupNotFound
	}

	if err := r.db.Create(permission).Error; err != nil {
		if isDuplicateKeyError(err) {
			return ErrPermissionConflict
		}
		return err
	}

	return nil
}

func (r *GormRepository) UpdatePermissionType(id string, permissionType PermissionType) (*ResourcePermission, error) {
	var existing ResourcePermission
	if err := r.db.First(&existing, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrPermissionNotFound
		}
		return nil, err
	}

	if existing.PermissionType == permissionType {
		return nil, ErrPermissionConflict
	}

	result := r.db.Model(&ResourcePermission{}).
		Where("id = ?", id).
		Update("permission_type", permissionType)

	if result.Error != nil {
		if isDuplicateKeyError(result.Error) {
			return nil, ErrPermissionConflict
		}
		return nil, result.Error
	}

	if result.RowsAffected == 0 {
		return nil, ErrPermissionNotFound
	}

	var updated ResourcePermission
	if err := r.db.First(&updated, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrPermissionNotFound
		}
		return nil, err
	}

	return &updated, nil
}

func (r *GormRepository) DeletePermission(id string) error {
	result := r.db.Delete(&ResourcePermission{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrPermissionNotFound
	}

	return nil
}

func (r *GormRepository) GetPermissionsByGroupID(groupID string) ([]GroupPermissionResult, error) {
	var groupCount int64
	if err := r.db.Table("groups").Where("id = ?", groupID).Count(&groupCount).Error; err != nil {
		return nil, err
	}
	if groupCount == 0 {
		return nil, ErrGroupNotFound
	}

	var permissions []GroupPermissionResult
	err := r.db.Table("resource_permissions rp").
		Select("rp.id, rp.resource_id, r.name AS resource_name, rp.permission_type").
		Joins("JOIN resources r ON r.id = rp.resource_id").
		Where("rp.group_id = ?", groupID).
		Order("r.name ASC").
		Order("rp.permission_type ASC").
		Scan(&permissions).Error
	if err != nil {
		return nil, err
	}

	return permissions, nil
}

func isDuplicateKeyError(err error) bool {
	if mysqlErr, ok := err.(*mysqlDriver.MySQLError); ok {
		return mysqlErr.Number == 1062
	}

	return strings.Contains(strings.ToLower(err.Error()), "duplicate")
}
