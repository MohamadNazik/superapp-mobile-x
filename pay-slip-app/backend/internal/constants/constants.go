// internal/constants/constants.go
package constants

type Role string

const (
	RoleAdmin Role = "admin"
	RoleUser  Role = "user"
)

const (
	ContextUserKey = "user"
)

const (
	MaxUploadSizeMB = 10 // maximum allowed pay slip file size in megabytes
)

var allowedExtensions = []string{".pdf", ".png", ".jpg", ".jpeg"}

// GetAllowedExtensions returns a copy of the allowed file extensions for pay slips.
func GetAllowedExtensions() []string {
	// Return a copy to ensure immutability
	extensions := make([]string, len(allowedExtensions))
	copy(extensions, allowedExtensions)
	return extensions
}

// GetAllowedExtensionsMap returns a map of allowed file extensions for efficient lookup.
func GetAllowedExtensionsMap() map[string]struct{} {
	m := make(map[string]struct{}, len(allowedExtensions))
	for _, ext := range allowedExtensions {
		m[ext] = struct{}{}
	}
	return m
}

// Database / connection defaults (tweak according to your environment)
const (
	ConnMaxLifetimeMinutes = 5  // number of minutes before a connection is recycled
	PingIntervalSeconds    = 60 // how often background pinger runs (seconds)
	MaxIdleConns           = 10 // maximum idle connections in the pool
	MaxOpenConns           = 50 // maximum open connections allowed
	ReconnectFailThreshold = 3  // consecutive ping failures before reconnect attempt
)
