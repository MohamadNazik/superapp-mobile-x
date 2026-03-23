package group

import "github.com/google/uuid"

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateGroup(group *Group) error {
	group.ID = uuid.New().String()
	return s.repo.CreateGroup(group)
}

func (s *Service) GetGroups() ([]Group, error) {
	return s.repo.GetGroups()
}

func (s *Service) UpdateGroup(group *Group) error {
	return s.repo.UpdateGroup(group)
}

func (s *Service) DeleteGroup(id string) error {
	return s.repo.DeleteGroup(id)
}