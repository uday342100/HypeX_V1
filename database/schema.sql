-- Database Schema for National Unified Material Master (MySQL)

CREATE DATABASE IF NOT EXISTS nmm_db;
USE nmm_db;

-- 1. Materials Table
CREATE TABLE IF NOT EXISTS materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cpse_name VARCHAR(255) NOT NULL,
  original_code VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  specifications TEXT,
  technical_parameters TEXT,
  material_type VARCHAR(255),
  material_grade VARCHAR(255),
  dimension VARCHAR(255),
  dimension_unit VARCHAR(50),
  length VARCHAR(255),
  length_unit VARCHAR(50),
  pressure VARCHAR(255),
  pressure_unit VARCHAR(50),
  standard_reference VARCHAR(255),
  unit_of_measurement VARCHAR(50),
  classification VARCHAR(255),
  normalized_description TEXT,
  match_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, REVIEW, INSUFFICIENT
  national_code VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Material Embeddings Table
CREATE TABLE IF NOT EXISTS material_embeddings (
  material_id INT PRIMARY KEY,
  embedding JSON NOT NULL, -- JSON array of floats (384 dimensions)
  FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE CASCADE
);

-- 3. Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_a_id INT NOT NULL,
  material_b_id INT NOT NULL,
  semantic_score REAL,
  technical_score REAL,
  final_score REAL,
  result VARCHAR(100), -- EXACT DUPLICATE, EQUIVALENT, NEAR DUPLICATE, POSSIBLE MATCH, DIFFERENT, INSUFFICIENT INFORMATION
  reason TEXT,
  comparison JSON, -- JSON details of structural matching checks
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  reviewer_comment TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_a_id) REFERENCES materials (id) ON DELETE CASCADE,
  FOREIGN KEY (material_b_id) REFERENCES materials (id) ON DELETE CASCADE
);

-- 4. Clusters Table
CREATE TABLE IF NOT EXISTS clusters (
  id VARCHAR(255) PRIMARY KEY, -- CL-00001 etc
  national_code VARCHAR(255) UNIQUE, -- NMC-00001 etc
  standardized_description TEXT,
  category VARCHAR(255),
  confidence REAL,
  status VARCHAR(50) DEFAULT 'APPROVED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Cluster Members Table
CREATE TABLE IF NOT EXISTS cluster_members (
  cluster_id VARCHAR(255) NOT NULL,
  material_id INT NOT NULL,
  PRIMARY KEY (cluster_id, material_id),
  FOREIGN KEY (cluster_id) REFERENCES clusters (id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE CASCADE
);

-- 6. National Material Codes Table
CREATE TABLE IF NOT EXISTS national_codes (
  code VARCHAR(255) PRIMARY KEY, -- NMC-00001 etc
  standard_description TEXT NOT NULL,
  category VARCHAR(255),
  specifications TEXT,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Mappings Table
CREATE TABLE IF NOT EXISTS mappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  national_code VARCHAR(255) NOT NULL,
  cpse_name VARCHAR(255) NOT NULL,
  original_code VARCHAR(255) NOT NULL,
  material_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (national_code) REFERENCES national_codes (code) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE CASCADE
);

-- 8. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- ADMIN, MANAGER, REVIEWER, APPROVER, VIEWER
  full_name VARCHAR(255)
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  username VARCHAR(255),
  action VARCHAR(255) NOT NULL, -- Upload, Normalize, Match, Approve, Reject, Mapping Modified, NMC Created
  material_id INT,
  decision VARCHAR(100),
  comment TEXT
);

-- 10. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT,
  reviewer VARCHAR(255),
  decision VARCHAR(100),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE
);
