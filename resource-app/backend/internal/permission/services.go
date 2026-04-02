package permission

import (
	"context"
	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreatePermission(permission *ResourcePermission) error {
	if !IsValidPermissionType(permission.PermissionType) {
		return ErrInvalidPermissionType
	}

	permission.ID = uuid.New().String()
	return s.repo.CreatePermission(permission)
}

func (s *Service) UpdatePermissionType(id string, permissionType PermissionType) (*ResourcePermission, error) {
	if !IsValidPermissionType(permissionType) {
		return nil, ErrInvalidPermissionType
	}

	return s.repo.UpdatePermissionType(id, permissionType)
}

func (s *Service) DeletePermission(id string) error {
	return s.repo.DeletePermission(id)
}

func (s *Service) GetPermissionsByGroupID(groupID string) ([]GroupPermissionResult, error) {
	return s.repo.GetPermissionsByGroupID(groupID)
}

func (s *Service) GetPermissionsByResourceID(ctx context.Context, resourceID string) ([]ResourcePermissionResult, error) {
	return s.repo.GetPermissionsByResourceID(ctx, resourceID)
}

func (s *Service) HasRequestPermission(userID, resourceID string) (bool, error) {
	return s.repo.HasUserPermissionForResource(userID, resourceID, PermissionTypeRequest)
}

func (s *Service) HasApprovePermission(userID, resourceID string) (bool, error) {
	return s.repo.HasUserPermissionForResource(userID, resourceID, PermissionTypeApprove)
}
