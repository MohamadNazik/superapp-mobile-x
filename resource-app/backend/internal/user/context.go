package user

import "github.com/gin-gonic/gin"

// GetUserFromContext retrieves the user object from the Gin context
func GetUserFromContext(c *gin.Context) *User {
	if u, exists := c.Get("user"); exists {
		if uObj, ok := u.(*User); ok {
			return uObj
		}
	}
	return nil
}
