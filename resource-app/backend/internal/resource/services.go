package resource

import "github.com/google/uuid"

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetResources() ([]Resource, error) {
	return s.repo.GetResources()
}

func (s *Service) AddResource(resource *Resource) error {
	resource.ID = uuid.New().String()
	return s.repo.AddResource(resource)
}

func (s *Service) UpdateResource(resource *Resource) error {
	return s.repo.UpdateResource(resource)
}

func (s *Service) DeleteResource(id string) error {
	return s.repo.DeleteResource(id)
}

func (s *Service) GetResourceByID(id string) (*Resource, error) {
	return s.repo.GetResourceByID(id)
}

