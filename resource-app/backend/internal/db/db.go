package db

import (
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"resource-app/internal/config"
	"resource-app/internal/user"
	"resource-app/internal/resource"
	"resource-app/internal/booking"
)

// NewDatabase creates a new database connection
func NewDatabase(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	// Auto-migrate models
	if err := db.AutoMigrate(&user.User{}, &resource.Resource{}, &booking.Booking{}); err != nil {
		return nil, err
	}

	// Configure connection pool
	if sqlDB, err := db.DB(); err == nil {
		sqlDB.SetConnMaxLifetime(time.Duration(config.ConnMaxLifetimeMinutes) * time.Minute)
		sqlDB.SetMaxIdleConns(config.MaxIdleConns)
		sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	}

	log.Println("Database connection established and schema migrated successfully")
	return db, nil
}
