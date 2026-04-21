package resource

import (
	"resource-app/internal/utils"

	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetResources(currentUserID string) ([]ResourceListItem, error) {
	return s.repo.GetResources(currentUserID)
}

func (s *Service) AddResource(resource *Resource) error {
	// Normalize resource names at service boundary before persistence.
	// This keeps the DB value consistent with frontend-triggered canonical format.
	resource.Name = utils.NormalizeName(resource.Name)
	resource.ID = uuid.New().String()
	return s.repo.AddResource(resource)
}

func (s *Service) UpdateResource(resource *Resource) error {
	resource.Name = utils.NormalizeName(resource.Name)
	return s.repo.UpdateResource(resource)
}

func (s *Service) DeleteResource(id string) error {
	return s.repo.DeleteResource(id)
}

func (s *Service) GetResourceByID(id string) (*Resource, error) {
	return s.repo.GetResourceByID(id)
}


