package auth

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jws"
	"github.com/lestrrat-go/jwx/v2/jwt"

	"resource-app/internal/user"
)

// JWTClaims represents the expected claims in the JWT token
type JWTClaims struct {
	Email string `json:"email"` // User's email address
}

var jwksCache jwk.Set

// InitJWKS initializes the JSON Web Key Set (JWKS) from the configured URL
func InitJWKS() error {
	jwksURL := os.Getenv("JWKS_URL")
	if jwksURL == "" {
		return fmt.Errorf("JWKS_URL environment variable not configured")
	}

	cache := jwk.NewCache(context.Background())
	if err := cache.Register(jwksURL); err != nil {
		return fmt.Errorf("failed to register JWKS URL: %w", err)
	}

	ctx := context.Background()
	cached, err := cache.Refresh(ctx, jwksURL)
	if err != nil {
		return fmt.Errorf("failed to fetch JWKS from %s: %w", jwksURL, err)
	}

	jwksCache = cached
	return nil
}

// UserService interface defines the methods required by the auth middleware
type UserService interface {
	GetUserByEmail(email string) (*user.User, error)
	CreateUser(user *user.User) error
}

// AuthMiddleware validates JWT tokens and ensures the user exists in the database
func AuthMiddleware(userService UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing Authorization header"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Authorization header format. Expected: Bearer <token>"})
			c.Abort()
			return
		}
		tokenString := parts[1]

		// Parse and validate the JWT token
		token, err := jwt.Parse(
			[]byte(tokenString),
			jwt.WithKeySet(jwksCache, jws.WithInferAlgorithmFromKey(true)),
			jwt.WithValidate(true),
		)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Extract user information from token claims
		email, ok := token.Get("email")
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Email claim not found in token"})
			c.Abort()
			return
		}

		emailStr, ok := email.(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email claim type"})
			c.Abort()
			return
		}

		// Check if user exists, create if not
		currentUser, err := userService.GetUserByEmail(emailStr)
		if err != nil {
			// If user not found (or other error), try to create
			// Note: In a real app, we should check specifically for "not found" error
			// But for simplicity/robustness here, we'll try to create if retrieval fails
			// assuming it's because the user doesn't exist.

			// Create new user
			newUser := &user.User{
				ID:        generateUUID(),
				Email:     emailStr,
				Role:      user.RoleUser,
				CreatedAt: time.Now(),
			}

			if createErr := userService.CreateUser(newUser); createErr != nil {
				// If creation fails, it might be a race condition or actual DB error
				// Try fetching one more time to be safe
				currentUser, err = userService.GetUserByEmail(emailStr)
				if err != nil {
					log.Printf("Failed to auto-create user %s: %v", emailStr, createErr)
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to authenticate user"})
					c.Abort()
					return
				}
			} else {
				currentUser = newUser
				log.Printf("Auto-created new user: %s", emailStr)
			}
		}

		// Store user info in request context
		c.Set("userEmail", emailStr)
		c.Set("user", currentUser)
		c.Next()
	}
}

// DevAuthMiddleware provides a mock user for local development when JWKS is not configured
func DevAuthMiddleware(userService UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		emailStr := "dev@example.com"

		// Check if dev user exists, create if not
		currentUser, err := userService.GetUserByEmail(emailStr)
		if err != nil {
			// Create new dev user
			newUser := &user.User{
				ID:        generateUUID(),
				Email:     emailStr,
				Role:      user.RoleAdmin, // Admins for dev convenience
				CreatedAt: time.Now(),
			}

			if createErr := userService.CreateUser(newUser); createErr != nil {
				log.Printf("Failed to auto-create dev user: %v", createErr)
				// Try fetching one more time to handle potential race conditions
				// (e.g. another concurrent request just created the user)
				currentUser, err = userService.GetUserByEmail(emailStr)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to establish dev user for authentication"})
					c.Abort()
					return
				}
			} else {
				currentUser = newUser
				log.Printf("Auto-created new dev user: %s", emailStr)
			}
		}

		// Store user info in request context
		c.Set("userEmail", emailStr)
		c.Set("user", currentUser)
		c.Next()
	}
}

// GetUserFromContext retrieves the user object from the Gin context
func GetUserFromContext(c *gin.Context) *user.User {
	return user.GetUserFromContext(c)
}

// RequireAdminMiddleware restricts access to users with ADMIN role.
// This middleware reads the user from request context and does not query the database.
func RequireAdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		currentUser := GetUserFromContext(c)
		if currentUser == nil || currentUser.Role != user.RoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Helper to generate UUID (simplified for this file, ideally in a utils package)
// We'll use the google/uuid package in the main file, but here we can just import it
// or rely on the store to handle ID generation if we change the model.
// Helper to generate UUID
func generateUUID() string {
	return uuid.New().String()
}
