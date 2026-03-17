package booking

import (
	"errors"
	"net/http"
	"resource-app/internal/auth"
	"time"

	"github.com/gin-gonic/gin"
)

func HandleGetBookings(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		bookings, err := svc.GetBookings()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "data": bookings})
	}
}

func HandleCreateBooking(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req Booking
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get current user
		user := auth.GetUserFromContext(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		if err := svc.CreateBooking(&req, user.ID, user.Role); err != nil {
			if errors.Is(err, ErrResourceNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Resource not found"})
				return
			}
			if errors.Is(err, ErrBookingConflict) {
				c.JSON(http.StatusConflict, gin.H{"success": false, "error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"success": true, "data": req})
	}
}

func HandleProcessBooking(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req struct {
			Status          BookingStatus `json:"status" binding:"required"`
			RejectionReason *string              `json:"rejectionReason"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := svc.UpdateBookingStatus(id, req.Status, req.RejectionReason); err != nil {
			if errors.Is(err, ErrBookingNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking status"})
			return
		}

		// Fetch updated booking to return
		// For now just return success
		c.JSON(http.StatusOK, gin.H{"success": true})
	}
}

func HandleRescheduleBooking(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req struct {
			Start time.Time `json:"start" binding:"required"`
			End   time.Time `json:"end" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := svc.RescheduleBooking(id, req.Start, req.End); err != nil {
			if errors.Is(err, ErrBookingNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
				return
			}
			if errors.Is(err, ErrRescheduleSlotConflict) {
				c.JSON(http.StatusConflict, gin.H{"success": false, "error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reschedule booking"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	}
}

func HandleCancelBooking(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := svc.CancelBooking(id); err != nil {
			if errors.Is(err, ErrBookingNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel booking"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "data": true})
	}
}
