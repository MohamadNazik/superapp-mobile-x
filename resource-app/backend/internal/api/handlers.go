package api

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"resource-app/internal/store"
)

// --- Stats ---

func HandleGetStats(store *store.DBStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		stats, err := store.GetUtilizationStats()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate stats"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "data": stats})
	}
}

