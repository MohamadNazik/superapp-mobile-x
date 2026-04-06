package db

import (
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"resource-app/internal/config"
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

	// Configure connection pool
	if sqlDB, err := db.DB(); err == nil {
		sqlDB.SetConnMaxLifetime(time.Duration(config.ConnMaxLifetimeMinutes) * time.Minute)
		sqlDB.SetMaxIdleConns(config.MaxIdleConns)
		sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	}

	log.Println("Database connection established successfully")
	return db, nil
}
