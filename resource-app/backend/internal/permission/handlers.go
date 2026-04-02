package permission

import (
	"errors"
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func HandleCreatePermission(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreatePermissionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if _, err := uuid.Parse(req.ResourceID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid resource ID"})
			return
		}

		if _, err := uuid.Parse(req.GroupID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
			return
		}

		permission := ResourcePermission{
			ResourceID:     req.ResourceID,
			GroupID:        req.GroupID,
			PermissionType: req.PermissionType,
		}

		if err := svc.CreatePermission(&permission); err != nil {
			switch {
			case errors.Is(err, ErrInvalidPermissionType):
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			case errors.Is(err, ErrResourceNotFound), errors.Is(err, ErrGroupNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			case errors.Is(err, ErrPermissionConflict):
				c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create permission"})
			}
			return
		}

		c.JSON(http.StatusCreated, gin.H{"success": true, "data": permission})
	}
}

func HandleUpdatePermissionType(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if _, err := uuid.Parse(id); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid permission ID"})
			return
		}

		var req UpdatePermissionTypeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		updated, err := svc.UpdatePermissionType(id, req.PermissionType)
		if err != nil {
			switch {
			case errors.Is(err, ErrInvalidPermissionType):
				c.JSON(http.StatusBadRequest, gin.H{"error": ErrInvalidPermissionType.Error()})
			case errors.Is(err, ErrPermissionNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": ErrPermissionNotFound.Error()})
			case errors.Is(err, ErrPermissionConflict):
				c.JSON(http.StatusConflict, gin.H{"error": ErrPermissionConflict.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update permission"})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": updated})
	}
}

func HandleDeletePermission(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if _, err := uuid.Parse(id); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid permission ID"})
			return
		}

		if err := svc.DeletePermission(id); err != nil {
			switch {
			case errors.Is(err, ErrPermissionNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": ErrPermissionNotFound.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete permission"})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": true})
	}
}

func HandleGetGroupPermissions(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		groupID := c.Param("id")
		if _, err := uuid.Parse(groupID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
			return
		}

		permissions, err := svc.GetPermissionsByGroupID(groupID)
		if err != nil {
			switch {
			case errors.Is(err, ErrGroupNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": ErrGroupNotFound.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group permissions"})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": permissions})
	}
}

func HandleGetResourcePermissions(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		resourceID := c.Param("id")

		permissions, err := svc.GetPermissionsByResourceID(c.Request.Context(), resourceID)
		if err != nil {
			switch {
			case errors.Is(err, ErrResourceNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": ErrResourceNotFound.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch resource permissions"})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": permissions})
	}
}
