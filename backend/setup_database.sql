-- Create the database
CREATE DATABASE IF NOT EXISTS time_tracker;

-- Use the database
USE time_tracker;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  status ENUM('active', 'completed') DEFAULT 'active'
) ENGINE=InnoDB;

-- Create task_sessions table
CREATE TABLE IF NOT EXISTS task_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Insert a sample task if the table is empty
INSERT INTO tasks (title, description, status)
SELECT 'Sample Task', 'This is a sample task to test the application', 'active'
WHERE NOT EXISTS (SELECT 1 FROM tasks LIMIT 1);

-- Show the created tables
SHOW TABLES;