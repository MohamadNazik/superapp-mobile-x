package booking

import (
	"errors"

	"resource-app/internal/shared"
)

// BookingStatus is an alias for shared.BookingStatus to avoid import cycles.
type BookingStatus = shared.BookingStatus

const (
	StatusPending   = shared.StatusPending
	StatusConfirmed = shared.StatusConfirmed
	StatusRejected  = shared.StatusRejected
	StatusCancelled = shared.StatusCancelled
	StatusCompleted = shared.StatusCompleted
	StatusCheckedIn = shared.StatusCheckedIn
	StatusProposed  = shared.StatusProposed
)

var (
	ErrResourceNotFound       = errors.New("resource not found")
	ErrBookingNotFound        = errors.New("booking not found")
	ErrBookingConflict        = errors.New("booking conflict: time slot is already booked")
	ErrRescheduleSlotConflict = errors.New("reschedule conflict: new time slot is already booked")
)
