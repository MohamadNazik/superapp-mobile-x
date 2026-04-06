package group

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func HandleCreateGroup(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payload CreateGroupPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		result, err := svc.CreateGroup(&payload)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNameDuplicate):
				c.JSON(http.StatusConflict, gin.H{"success": false, "error": err.Error()})
			default:
				log.Printf("error creating group: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create group"})
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch groups"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": groups})
	}
}

func HandleUpdateGroup(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		groupID := c.Param("id")
		if _, err := uuid.Parse(groupID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
			return
		}

		var payload UpdateGroupPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := svc.UpdateGroup(groupID, &payload); err != nil {
			switch {
			case errors.Is(err, ErrGroupNameDuplicate):
				c.JSON(http.StatusConflict, gin.H{"success": false, "error": err.Error()})
			case errors.Is(err, ErrGroupNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": ErrGroupNotFound.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update group"})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": payload})
	}
}

func HandleDeleteGroup(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		groupID := c.Param("id")
		if _, err := uuid.Parse(groupID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
			return
		}

		err := svc.DeleteGroup(groupID)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": ErrGroupNotFound.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete group"})
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
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
			return
		}

		var req AddUsersToGroupRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		for _, userID := range req.UserIDs {
			if _, err := uuid.Parse(userID); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user IDs"})
				return
			}
		}

		result, err := svc.AddUsersToGroup(groupID, req.UserIDs)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNotFound), errors.Is(err, ErrUserNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add users to group: "})
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
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
			return
		}

		userID := c.Param("userId")
		if _, err := uuid.Parse(userID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
			return
		}

		_, err := svc.RemoveUserFromGroup(groupID, userID)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNotFound), errors.Is(err, ErrGroupMembershipNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove user from group"})
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
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
			return
		}

		members, err := svc.GetGroupMembers(groupID)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": ErrGroupNotFound.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group members"})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": members})
	}
}
