// pkg/auth/auth.go
package auth

import (
	"context"
	"log"
	"net/http"
	"os"
	"pay-slip-app/internal/constants"
	"pay-slip-app/internal/db"
	"strings"
	"time"

	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jwt"
)

type Authenticator struct {
	DB     *db.Database
	jwks   jwk.Set
	cancel context.CancelFunc
}

func New(database *db.Database) (*Authenticator, error) {
	env := os.Getenv("ENVIRONMENT")
	if env != "production" {
		// In development/test mode, we don't need JWKS as we use a mock user.
		return &Authenticator{
			DB: database,
		}, nil
	}

	jwksURL := os.Getenv("JWKS_URL")
	if jwksURL == "" {
		log.Fatal("JWKS_URL environment variable not set (required in production)")
	}

	ctx, cancel := context.WithCancel(context.Background())

	set, err := jwk.Fetch(ctx, jwksURL)
	if err != nil {
		cancel()
		return nil, err
	}

	a := &Authenticator{
		DB:     database,
		jwks:   set,
		cancel: cancel,
	}

	// Refresh JWKS in the background every hour.
	go a.refreshJwks(ctx, jwksURL)

	return a, nil
}

// Close stops the background JWKS refresh.
func (a *Authenticator) Close() {
	if a.cancel != nil {
		a.cancel()
	}
}

func (a *Authenticator) refreshJwks(ctx context.Context, jwksURL string) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			set, err := jwk.Fetch(ctx, jwksURL)
			if err != nil {
				log.Printf("Failed to refresh JWKS: %v", err)
				continue
			}
			a.jwks = set
			log.Println("Successfully refreshed JWKS")
		case <-ctx.Done():
			return
		}
	}
}

// AuthMiddleware validates the Bearer token, auto-creates the user record on first
// login, and stores the *models.User in the request context.
func (a *Authenticator) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var emailStr string
		environment := os.Getenv("ENVIRONMENT")
		if environment == "production" {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
				return
			}

			token, err := jwt.ParseString(parts[1], jwt.WithKeySet(a.jwks))
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			email, ok := token.Get("email")
			if !ok {
				http.Error(w, "Email claim not found in token", http.StatusUnauthorized)
				return
			}

			var ok2 bool
			emailStr, ok2 = email.(string)
			if !ok2 {
				http.Error(w, "Invalid email claim type", http.StatusUnauthorized)
				return
			}
		} else {
			emailStr = "admin@example.com"
		}

		user, err := a.DB.GetUserByEmail(emailStr)
		if err != nil {
			// Auto-create user on first login.
			if err.Error() == "sql: no rows in result set" {
				user, err = a.DB.CreateUser(emailStr)
				if err != nil {
					http.Error(w, "Failed to create user", http.StatusInternalServerError)
					return
				}
			} else {
				http.Error(w, "Database error", http.StatusInternalServerError)
				return
			}
		}

		// Inject user into context
		ctx := context.WithValue(r.Context(), constants.ContextUserKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
