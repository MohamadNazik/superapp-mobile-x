package permission

import (
	"context"
	"strings"

	mysqlDriver "github.com/go-sql-driver/mysql"
	"gorm.io/gorm"
)

type Repository interface {
	CreatePermission(permission *ResourcePermission) error
	UpdatePermissionType(id string, permissionType PermissionType) (*ResourcePermission, error)
	DeletePermission(id string) error
	GetPermissionsByGroupID(groupID string) ([]GroupPermissionResult, error)
	GetPermissionsByResourceID(ctx context.Context, resourceID string) ([]ResourcePermissionResult, error)
	HasUserPermissionForResource(userID, resourceID string, permissionType PermissionType) (bool, error)
}

type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) CreatePermission(permission *ResourcePermission) error {
	if err := r.db.Create(permission).Error; err != nil {
		if fkViolation, constraintName := foreignKeyConstraintError(err); fkViolation {
			switch constraintName {
			case "fk_resource_permissions_resource":
				return ErrResourceNotFound
			case "fk_resource_permissions_group":
				return ErrGroupNotFound
			}
		}
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
		return &existing, nil
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

	existing.PermissionType = permissionType
	return &existing, nil
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

func (r *GormRepository) GetPermissionsByResourceID(ctx context.Context, resourceID string) ([]ResourcePermissionResult, error) {
	var permissions []ResourcePermissionResult
	err := r.db.WithContext(ctx).
		Table("resource_permissions AS rp").
		Select("rp.id, rp.group_id, g.name AS group_name, rp.permission_type").
		Joins("JOIN `groups` AS g ON g.id = rp.group_id").
		Where("rp.resource_id = ?", resourceID).
		Order("g.name ASC, rp.permission_type ASC").
		Scan(&permissions).Error
	if err != nil {
		return nil, err
	}

	if len(permissions) == 0 {
		var resourceCount int64
		if err := r.db.WithContext(ctx).Table("resources").Where("id = ?", resourceID).Count(&resourceCount).Error; err != nil {
			return nil, err
		}
		if resourceCount == 0 {
			return nil, ErrResourceNotFound
		}
	}

	return permissions, nil
}

func isDuplicateKeyError(err error) bool {
	if mysqlErr, ok := err.(*mysqlDriver.MySQLError); ok {
		return mysqlErr.Number == 1062
	}

	return strings.Contains(strings.ToLower(err.Error()), "duplicate")
}

func (r *GormRepository) HasUserPermissionForResource(userID, resourceID string, permissionType PermissionType) (bool, error) {
	var count int64
	err := r.db.
		Table("resource_permissions rp").
		Joins("JOIN user_groups ug ON rp.group_id = ug.group_id").
		Where("ug.user_id = ? AND rp.resource_id = ? AND rp.permission_type = ?",
			userID, resourceID, permissionType).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func foreignKeyConstraintError(err error) (bool, string) {
	mysqlErr, ok := err.(*mysqlDriver.MySQLError)
	if !ok || mysqlErr.Number != 1452 {
		return false, ""
	}

	message := strings.ToLower(mysqlErr.Message)
	if strings.Contains(message, "fk_resource_permissions_resource") {
		return true, "fk_resource_permissions_resource"
	}
	if strings.Contains(message, "fk_resource_permissions_group") {
		return true, "fk_resource_permissions_group"
	}

	return false, ""
}
