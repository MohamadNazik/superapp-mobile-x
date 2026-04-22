package group

import (
	"errors"
	"log"
	"net/http"
	"resource-app/internal/auth"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func HandleCreateGroup(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payload CreateGroupPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
			return
		}

		result, err := svc.CreateGroup(&payload)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNameDuplicate):
				c.JSON(http.StatusConflict, gin.H{"success": false, "error": err.Error()})
			default:
				log.Printf("error creating group: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create group"})
			}
			return
		}

		c.JSON(http.StatusCreated, gin.H{"success": true, "data": result})
	}
}

func HandleGetGroups(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		groups, err := svc.GetGroups()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch groups"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": groups})
	}
}

func HandleUpdateGroup(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		groupID := c.Param("id")
		if _, err := uuid.Parse(groupID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid group ID"})
			return
		}

		var payload UpdateGroupPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
			return
		}

		updated, err := svc.UpdateGroup(groupID, &payload)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNameDuplicate):
				c.JSON(http.StatusConflict, gin.H{"success": false, "error": err.Error()})
			case errors.Is(err, ErrGroupNotFound):
				c.JSON(http.StatusNotFound, gin.H{"success": false, "error": ErrGroupNotFound.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to update group"})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": updated})
	}
}

func HandleDeleteGroup(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		groupID := c.Param("id")
		if _, err := uuid.Parse(groupID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid group ID"})
			return
		}

		err := svc.DeleteGroup(groupID)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNotFound):
				c.JSON(http.StatusNotFound, gin.H{"success": false, "error": ErrGroupNotFound.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to delete group"})
			}
			return
		}

		c.Status(http.StatusNoContent)
	}
}

func HandleAddUsersToGroup(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		groupID := c.Param("id")
		if _, err := uuid.Parse(groupID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid group ID"})
			return
		}

		var req AddUsersToGroupRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
			return
		}

		for _, userID := range req.UserIDs {
			if _, err := uuid.Parse(userID); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid user IDs"})
				return
			}
		}

		result, err := svc.AddUsersToGroup(groupID, req.UserIDs)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNotFound), errors.Is(err, ErrUserNotFound):
				c.JSON(http.StatusNotFound, gin.H{"success": false, "error": err.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to add users to group"})
			}
			return
		}

		c.JSON(http.StatusCreated, gin.H{"success": true, "data": result})
	}
}

func HandleRemoveUserFromGroup(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		groupID := c.Param("id")
		if _, err := uuid.Parse(groupID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid group ID"})
			return
		}

		userID := c.Param("userId")
		if _, err := uuid.Parse(userID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid user ID"})
			return
		}

		_, err := svc.RemoveUserFromGroup(groupID, userID)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNotFound), errors.Is(err, ErrGroupMembershipNotFound):
				c.JSON(http.StatusNotFound, gin.H{"success": false, "error": err.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to remove user from group"})
			}
			return
		}

		c.Status(http.StatusNoContent)
	}
}

func HandleGetGroupMembers(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		groupID := c.Param("id")
		if _, err := uuid.Parse(groupID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid group ID"})
			return
		}

		members, err := svc.GetGroupMembers(groupID)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNotFound):
				c.JSON(http.StatusNotFound, gin.H{"success": false, "error": ErrGroupNotFound.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch group members"})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": members})
	}
}

func HandleGetMyGroups(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		currentUser := auth.GetUserFromContext(c)
		if currentUser == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "User not authenticated"})
			return
		}

		groups, err := svc.GetGroupsForUser(currentUser.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch user groups"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": groups})
	}
}
