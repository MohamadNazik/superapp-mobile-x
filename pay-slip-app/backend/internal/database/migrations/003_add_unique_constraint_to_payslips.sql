-- migrations/003_add_unique_constraint_to_payslips.sql
-- This migration adds a unique constraint to prevent duplicate payslips for the same user/period.

ALTER TABLE pay_slips ADD UNIQUE KEY uk_user_period (user_id, month, year);
