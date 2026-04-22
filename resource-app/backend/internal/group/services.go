package group

import "resource-app/internal/utils"

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateGroup(createGroup *CreateGroupPayload) (*CreateGroupResult, error) {
	// Normalize user-provided name before persist: trim spaces, collapse repeated spaces, and title-case.
	// This ensures the DB receives canonical names and duplicate key checks become effective.
	createGroup.Name = utils.NormalizeName(createGroup.Name)
	return s.repo.CreateGroup(createGroup)
}

func (s *Service) GetGroups() ([]Group, error) {
	return s.repo.GetGroups()
}

func (s *Service) GetGroupsForUser(userID string) ([]GetMyGroupsResult, error) {
	return s.repo.GetGroupsForUser(userID)
}

func (s *Service) UpdateGroup(id string, updateGroup *UpdateGroupPayload) (*Group, error) {
	updateGroup.Name = utils.NormalizeName(updateGroup.Name)
	return s.repo.UpdateGroup(id, updateGroup)
}

func (s *Service) DeleteGroup(id string) error {
	return s.repo.DeleteGroup(id)
}

func (s *Service) AddUsersToGroup(groupID string, userIDs []string) (*AddUsersToGroupResult, error) {
	return s.repo.AddUsersToGroup(groupID, userIDs)
}

func (s *Service) RemoveUserFromGroup(groupID, userID string) (*RemoveUserFromGroupResult, error) {
	return s.repo.RemoveUserFromGroup(groupID, userID)
}

func (s *Service) GetGroupMembers(groupID string) ([]GroupMemberResult, error) {
	return s.repo.GetGroupMembers(groupID)
}
