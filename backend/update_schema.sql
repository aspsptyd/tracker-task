-- SQL script to update the time tracker database schema
-- Run this script on your MySQL server to add the status column to the tasks table

USE time_tracker;

-- Add status column to tasks table
ALTER TABLE tasks ADD COLUMN status ENUM('active', 'completed') DEFAULT 'active';

-- Update existing tasks to have 'active' status by default
UPDATE tasks SET status = 'active' WHERE status IS NULL;

-- Verify the column was added
DESCRIBE tasks;
