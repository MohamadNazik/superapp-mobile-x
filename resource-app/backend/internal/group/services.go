package group

import "github.com/google/uuid"

type AddedUserResult struct {
	UserID string `json:"user_id"`
}

type AddUsersToGroupRequest struct {
	UserIDs []string `json:"user_ids" binding:"required,min=1,dive,required"`
}

type AddUsersToGroupResult struct {
	GroupID    string            `json:"group_id"`
	AddedUsers []AddedUserResult `json:"added_users"`
}

type RemoveUserFromGroupResult struct {
	GroupID   string    `json:"group_id"`
	UserID    string    `json:"user_id"`
}

type GroupMemberResult struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

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

func (s *Service) AddUsersToGroup(groupID string, userIDs []string) (*AddUsersToGroupResult, error) {
	return s.repo.AddUsersToGroup(groupID, userIDs)
}

func (s *Service) RemoveUserFromGroup(groupID, userID string) (*RemoveUserFromGroupResult, error) {
	return s.repo.RemoveUserFromGroup(groupID, userID)
}

func (s *Service) GetGroupMembers(groupID string) ([]GroupMemberResult, error) {
	return s.repo.GetGroupMembers(groupID)
}