package user

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleGetUsers(service *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		users, err := service.GetUsers()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "data": users})
	}
}

func HandleUpdateUserRole(service *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("id")
		var req struct {
			Role Role `json:"role" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := service.UpdateUserRole(userID, req.Role); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
			return
		}

		// Fetch updated user to return
		updatedUser, err := service.GetUserByID(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": updatedUser})
	}
}

func HandleGetMe() gin.HandlerFunc {
	return func(c *gin.Context) {
		currentUser := GetUserFromContext(c)
		if currentUser == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "data": currentUser})
	}
}

// RegisterRoutes registers the user routes
func RegisterRoutes(rg *gin.RouterGroup, service *Service) {
	users := rg.Group("/users")
	{
		users.GET("", HandleGetUsers(service))
		users.GET("/me", HandleGetMe())
		users.PATCH("/:id/role", HandleUpdateUserRole(service))
	}
}
