package permission

import "errors"

// PermissionType represents permission level assigned to a group for a resource.
type PermissionType string

const (
	PermissionTypeRequest PermissionType = "REQUEST"
	PermissionTypeApprove PermissionType = "APPROVE"
)

var (
	ErrPermissionNotFound    = errors.New("permission not found")
	ErrPermissionConflict    = errors.New("permission already exists for this group and resource")
	ErrInvalidPermissionType = errors.New("invalid permission type")
	ErrGroupNotFound         = errors.New("group not found")
	ErrResourceNotFound      = errors.New("resource not found")
)

func IsValidPermissionType(permissionType PermissionType) bool {
	switch permissionType {
	case PermissionTypeRequest, PermissionTypeApprove:
		return true
	default:
		return false
	}
}
