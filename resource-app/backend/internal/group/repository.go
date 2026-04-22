package group

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrGroupNotFound = errors.New("group not found")
var ErrUserNotFound = errors.New("one or more users not found")
var ErrGroupMembershipNotFound = errors.New("group membership not found")
var ErrGroupNameDuplicate = errors.New("group name already exists")

type Repository interface {
	CreateGroup(createGroup *CreateGroupPayload) (*CreateGroupResult, error)
	GetGroups() ([]Group, error)
	GetGroupsForUser(userID string) ([]GetMyGroupsResult, error)
	UpdateGroup(id string, updateGroup *UpdateGroupPayload) (*Group, error)
	DeleteGroup(id string) error
	AddUsersToGroup(groupID string, userIDs []string) (*AddUsersToGroupResult, error)
	RemoveUserFromGroup(groupID, userID string) (*RemoveUserFromGroupResult, error)
	GetGroupMembers(groupID string) ([]GroupMemberResult, error)
}

type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func uniqueStringIDs(ids []string) []string {
	seen := make(map[string]struct{}, len(ids))
	unique := make([]string, 0, len(ids))
	for _, id := range ids {
		if _, exists := seen[id]; exists {
			continue
		}
		seen[id] = struct{}{}
		unique = append(unique, id)
	}
	return unique
}

func (r *GormRepository) CreateGroup(createGroup *CreateGroupPayload) (*CreateGroupResult, error) {
	group := &Group{
		ID:          uuid.New().String(),
		Name:        createGroup.Name,
		Description: createGroup.Description,
	}

	addedUserIDs := make([]string, 0)

	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(group).Error; err != nil {
			// Map DB duplicate key failures to domain error so handler can return 409 Conflict.
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				return ErrGroupNameDuplicate
			}
			return err
		}

		result, err := r.assignUsersToGroupTx(tx, group.ID, createGroup.UserIDs, false)
		if err != nil {
			return err
		}

		addedUserIDs = make([]string, 0, len(result.AddedUsers))
		for _, addedUser := range result.AddedUsers {
			addedUserIDs = append(addedUserIDs, addedUser.UserID)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &CreateGroupResult{
		ID:          group.ID,
		Name:        group.Name,
		Description: group.Description,
		CreatedAt:   group.CreatedAt,
		UpdatedAt:   group.UpdatedAt,
		UserIDs:     addedUserIDs,
	}, nil
}

func (r *GormRepository) GetGroups() ([]Group, error) {
	var groups []Group
	result := r.db.Find(&groups)
	return groups, result.Error
}

func (r *GormRepository) GetGroupsForUser(userID string) ([]GetMyGroupsResult, error) {
	groups := make([]GetMyGroupsResult, 0)
	err := r.db.Model(&Group{}).
		Select("`groups`.id, `groups`.name").
		Joins("JOIN user_groups ug ON ug.group_id = `groups`.id").
		Where("ug.user_id = ?", userID).
		Order("`groups`.name ASC, `groups`.id ASC").
		Scan(&groups).Error
	if err != nil {
		return nil, err
	}

	return groups, nil
}

func (r *GormRepository) UpdateGroup(id string, updateGroup *UpdateGroupPayload) (*Group, error) {
	updates := Group{
		Name:        updateGroup.Name,
		Description: updateGroup.Description,
	}

	result := r.db.Model(&Group{}).
		Where("id = ?", id).
		Select("name", "description").
		Updates(&updates)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return nil, ErrGroupNameDuplicate
		}
		return nil, result.Error
	}

	if result.RowsAffected == 0 {
		return nil, ErrGroupNotFound
	}

	// Fetch and return the full updated object
	var updatedGroup Group
	if err := r.db.First(&updatedGroup, "id = ?", id).Error; err != nil {
		return nil, err
	}

	return &updatedGroup, nil
}

func (r *GormRepository) DeleteGroup(id string) error {
	result := r.db.Delete(&Group{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrGroupNotFound
	}
	return nil
}

func (r *GormRepository) assignUsersToGroupTx(tx *gorm.DB, groupID string, userIDs []string, ensureGroupExists bool) (*AddUsersToGroupResult, error) {
	uniqueUserIDs := uniqueStringIDs(userIDs)

	if ensureGroupExists {
		var groupCount int64
		if err := tx.Model(&Group{}).Where("id = ?", groupID).Count(&groupCount).Error; err != nil {
			return nil, err
		}
		if groupCount == 0 {
			return nil, ErrGroupNotFound
		}
	}

	var userCount int64
	if err := tx.Table("users").Where("id IN ?", uniqueUserIDs).Count(&userCount).Error; err != nil {
		return nil, err
	}
	if userCount != int64(len(uniqueUserIDs)) {
		return nil, ErrUserNotFound
	}

	memberships := make([]UserGroup, 0, len(uniqueUserIDs))
	addedUsers := make([]AddedUserResult, 0, len(uniqueUserIDs))

	var existingUserIDs []string
	if err := tx.Table("user_groups").
		Where("group_id = ? AND user_id IN ?", groupID, uniqueUserIDs).
		Pluck("user_id", &existingUserIDs).Error; err != nil {
		return nil, err
	}

	existing := make(map[string]struct{}, len(existingUserIDs))
	for _, userID := range existingUserIDs {
		existing[userID] = struct{}{}
	}

	for _, userID := range uniqueUserIDs {
		if _, ok := existing[userID]; ok {
			continue
		}

		memberships = append(memberships, UserGroup{
			ID:      uuid.New().String(),
			UserID:  userID,
			GroupID: groupID,
		})
		addedUsers = append(addedUsers, AddedUserResult{UserID: userID})
	}

	if len(memberships) > 0 {
		if err := tx.Table("user_groups").Clauses(clause.OnConflict{DoNothing: true}).Create(&memberships).Error; err != nil {
			return nil, err
		}
	}

	return &AddUsersToGroupResult{
		GroupID:    groupID,
		AddedUsers: addedUsers,
	}, nil
}

func (r *GormRepository) AddUsersToGroup(groupID string, userIDs []string) (*AddUsersToGroupResult, error) {
	var response *AddUsersToGroupResult

	err := r.db.Transaction(func(tx *gorm.DB) error {
		result, err := r.assignUsersToGroupTx(tx, groupID, userIDs, true)
		if err != nil {
			return err
		}

		response = result
		return nil
	})
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (r *GormRepository) RemoveUserFromGroup(groupID, userID string) (*RemoveUserFromGroupResult, error) {
	var response *RemoveUserFromGroupResult

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// Ensure group exists before modifying membership
		var groupCount int64
		if err := tx.Model(&Group{}).Where("id = ?", groupID).Count(&groupCount).Error; err != nil {
			return err
		}
		if groupCount == 0 {
			return ErrGroupNotFound
		}

		// Delete the membership row atomically
		result := tx.Table("user_groups").Where("group_id = ? AND user_id = ?", groupID, userID).Delete(&UserGroup{})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrGroupMembershipNotFound
		}

		response = &RemoveUserFromGroupResult{
			GroupID: groupID,
			UserID:  userID,
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return response, nil
}

func (r *GormRepository) GetGroupMembers(groupID string) ([]GroupMemberResult, error) {
	var groupCount int64
	if err := r.db.Model(&Group{}).Where("id = ?", groupID).Count(&groupCount).Error; err != nil {
		return nil, err
	}
	if groupCount == 0 {
		return nil, ErrGroupNotFound
	}

	var members []GroupMemberResult
	err := r.db.Table("user_groups ug").
		Select("u.id, u.email AS name, u.email").
		Joins("JOIN users u ON u.id = ug.user_id").
		Where("ug.group_id = ?", groupID).
		Order("u.email ASC").
		Scan(&members).Error
	if err != nil {
		return nil, err
	}

	return members, nil
}
