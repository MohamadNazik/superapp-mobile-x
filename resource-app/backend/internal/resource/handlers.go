package resource

import (
	"errors"
	"net/http"
	"resource-app/internal/auth"

	"github.com/gin-gonic/gin"
)

func HandleGetResources(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := auth.GetUserFromContext(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "User not authenticated"})
			return
		}

		resources, err := svc.GetResources(user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch resources"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "data": resources})
	}
}

func HandleAddResource(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req Resource
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := svc.AddResource(&req); err != nil {
			switch {
			case errors.Is(err, ErrResourceNameDuplicate):
				c.JSON(http.StatusConflict, gin.H{"success": false, "error": err.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create resource"})
			}
			return
		}

		c.JSON(http.StatusCreated, gin.H{"success": true, "data": req})
	}
}

func HandleUpdateResource(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req Resource
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Ensure ID matches URL param
		req.ID = id

		if err := svc.UpdateResource(&req); err != nil {
			switch {
			case errors.Is(err, ErrResourceNotFound):
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			case errors.Is(err, ErrResourceNameDuplicate):
				c.JSON(http.StatusConflict, gin.H{"success": false, "error": err.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update resource"})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": req})
	}
}

func HandleDeleteResource(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := svc.DeleteResource(id); err != nil {
			switch {
			case errors.Is(err, ErrResourceNotFound):
				c.JSON(http.StatusNotFound, gin.H{"success": false, "error": err.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to delete resource"})
			}
			return
		}
		c.Status(http.StatusNoContent)
	}
}
