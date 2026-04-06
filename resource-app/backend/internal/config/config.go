package config

import (
	"os"
)

const (
	ServiceName = "resource-app"
	DefaultPort = "8082"

	// Database defaults
	DefaultDatabaseURL = "root:password@tcp(localhost:3306)/resource_app?charset=utf8mb4&parseTime=True&loc=Local"

	// Connection pool settings
	ConnMaxLifetimeMinutes = 5
	MaxIdleConns           = 10
	MaxOpenConns           = 50
	PingIntervalSeconds    = 60
	ReconnectFailThreshold = 3
)

// GetEnv retrieves an environment variable or returns a default value
func GetEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
