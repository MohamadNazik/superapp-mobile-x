package group

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrGroupNotFound = errors.New("group not found")
var ErrUserNotFound = errors.New("one or more users not found")
var ErrGroupMembershipConflict = errors.New("user/s already belong to this group")
var ErrGroupMembershipNotFound = errors.New("group membership not found")

type Repository interface {
	CreateGroup(group *Group) error
	GetGroups() ([]Group, error)
	UpdateGroup(group *Group) error
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

func (r *GormRepository) CreateGroup(group *Group) error {
	return r.db.Create(group).Error
}

func (r *GormRepository) GetGroups() ([]Group, error) {
	var groups []Group
	result := r.db.Find(&groups)
	return groups, result.Error
}

func (r *GormRepository) UpdateGroup(group *Group) error {
	result := r.db.Model(&Group{}).
        Where("id = ?", group.ID).
        Updates(Group{
            Name:        group.Name,
            Description: group.Description,
        })

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrGroupNotFound
	}

	return nil
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

func (r *GormRepository) AddUsersToGroup(groupID string, userIDs []string) (*AddUsersToGroupResult, error) {
	var response *AddUsersToGroupResult
	uniqueUserIDs := uniqueStringIDs(userIDs)

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var groupCount int64
		if err := tx.Model(&Group{}).Where("id = ?", groupID).Count(&groupCount).Error; err != nil {
			return err
		}
		if groupCount == 0 {
			return ErrGroupNotFound
		}

		var userCount int64
		if err := tx.Table("users").Where("id IN ?", uniqueUserIDs).Count(&userCount).Error; err != nil {
			return err
		}
		if userCount != int64(len(uniqueUserIDs)) {
			return ErrUserNotFound
		}

		memberships := make([]UserGroup, 0, len(uniqueUserIDs))
		addedUsers := make([]AddedUserResult, 0, len(uniqueUserIDs))
		for _, userID := range uniqueUserIDs {
			memberships = append(memberships, UserGroup{
				ID:      uuid.New().String(),
				UserID:  userID,
				GroupID: groupID,
			})
			addedUsers = append(addedUsers, AddedUserResult{UserID: userID})
		}

		if err := tx.Table("user_groups").Create(&memberships).Error; err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				return ErrGroupMembershipConflict
			}
			return err
		}

		response = &AddUsersToGroupResult{
			GroupID:    groupID,
			AddedUsers: addedUsers,
		}

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