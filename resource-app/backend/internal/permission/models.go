package permission

import "time"

type ResourcePermission struct {
	ID             string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ResourceID     string         `json:"resourceId" gorm:"type:varchar(36);not null;index"`
	GroupID        string         `json:"groupId" gorm:"type:varchar(36);not null;index"`
	PermissionType PermissionType `json:"permissionType" gorm:"type:varchar(20);not null"`
	CreatedAt      time.Time      `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt      time.Time      `json:"updatedAt" gorm:"autoUpdateTime"`
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
	ResourceID     string         `json:"resourceId"`
	ResourceName   string         `json:"resourceName"`
	PermissionType PermissionType `json:"permissionType"`
}

type ResourcePermissionResult struct {
	ID             string         `json:"id"`
	GroupID        string         `json:"groupId"`
	GroupName      string         `json:"groupName"`
	PermissionType PermissionType `json:"permissionType"`
}
