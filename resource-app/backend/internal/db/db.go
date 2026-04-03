package db

import (
	"log"
	"time"

	"resource-app/internal/booking"
	"resource-app/internal/config"
	"resource-app/internal/group"
	"resource-app/internal/permission"
	"resource-app/internal/resource"
	"resource-app/internal/user"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewDatabase creates a new database connection
func NewDatabase(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger:logger.Default.LogMode(logger.Info),
		TranslateError: true,
	})
	if err != nil {
		return nil, err
	}

	if config.AutoMigrate {
		// Auto-migrate models
		if err := db.AutoMigrate(&user.User{}, &resource.Resource{}, &booking.Booking{}, &group.Group{}, &group.UserGroup{}, &permission.ResourcePermission{}); err != nil {
			return nil, err
		}
	}

	// Configure connection pool
	if sqlDB, err := db.DB(); err == nil {
		sqlDB.SetConnMaxLifetime(time.Duration(config.ConnMaxLifetimeMinutes) * time.Minute)
		sqlDB.SetMaxIdleConns(config.MaxIdleConns)
		sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	}

	if config.AutoMigrate {
		log.Println("Database connection established and schema migrated successfully")
	} else {
		log.Println("Database connection established without auto-migration")
	}
	return db, nil
}
