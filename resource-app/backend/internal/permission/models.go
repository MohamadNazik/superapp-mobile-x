package permission

import "time"

type ResourcePermission struct {
	ID             string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ResourceID     string         `json:"resourceId" gorm:"column:resource_id;type:varchar(36);not null;index"`
	GroupID        string         `json:"groupId" gorm:"column:group_id;type:varchar(36);not null;index"`
	PermissionType PermissionType `json:"permissionType" gorm:"column:permission_type;type:varchar(20);not null"`
	CreatedAt      time.Time      `json:"createdAt" gorm:"autoCreateTime"`
}

func (ResourcePermission) TableName() string {
	return "resource_permissions"
}

type CreatePermissionRequest struct {
	ResourceID     string         `json:"resourceId" binding:"required"`
	GroupID        string         `json:"groupId" binding:"required"`
	PermissionType PermissionType `json:"permissionType" binding:"required"`
}

type UpdatePermissionTypeRequest struct {
	PermissionType PermissionType `json:"permissionType" binding:"required"`
}

type GroupPermissionResult struct {
	ID             string         `json:"id"`
	ResourceID     string         `json:"resourceId" gorm:"column:resource_id"`
	ResourceName   string         `json:"resourceName" gorm:"column:resource_name"`
	PermissionType PermissionType `json:"permissionType" gorm:"column:permission_type"`
}
