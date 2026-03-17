package booking

import "errors"

// BookingStatus represents the status of a booking
type BookingStatus string

const (
	StatusPending   BookingStatus = "pending"
	StatusConfirmed BookingStatus = "confirmed"
	StatusRejected  BookingStatus = "rejected"
	StatusCancelled BookingStatus = "cancelled"
	StatusCompleted BookingStatus = "completed"
	StatusCheckedIn BookingStatus = "checked_in"
	StatusProposed  BookingStatus = "proposed"
)

var (
	ErrResourceNotFound       = errors.New("resource not found")
	ErrBookingNotFound        = errors.New("booking not found")
	ErrBookingConflict        = errors.New("booking conflict: time slot is already booked")
	ErrRescheduleSlotConflict = errors.New("reschedule conflict: new time slot is already booked")
)