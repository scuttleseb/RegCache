-- database/init.sql - This will automatically run when MySQL container starts
-- Create the database (already created by docker-compose environment variables)
USE appliance_registration;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    appliance VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    type VARCHAR(100),
    state VARCHAR(2) NOT NULL,
    customer_segment ENUM('premium', 'standard', 'basic') NOT NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    final_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    session_id VARCHAR(100) NOT NULL,
    pricing_breakdown JSON,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_manufacturer (manufacturer),
    INDEX idx_appliance (appliance),
    INDEX idx_state (state),
    INDEX idx_customer_segment (customer_segment),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
);

-- Pricing history table (for audit and analytics)
CREATE TABLE IF NOT EXISTS pricing_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    pricing_step ENUM('base', 'tax', 'segment') NOT NULL,
    manufacturer VARCHAR(100),
    appliance VARCHAR(100),
    state VARCHAR(2),
    customer_segment VARCHAR(50),
    input_data JSON,
    output_data JSON,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_session_id (session_id),
    INDEX idx_pricing_step (pricing_step),
    INDEX idx_calculated_at (calculated_at)
);

-- Create a view for order summaries with customer info
CREATE VIEW order_summary AS
SELECT 
    o.id as order_id,
    o.session_id,
    CONCAT(c.first_name, ' ', c.last_name) as customer_name,
    c.email,
    c.phone,
    o.manufacturer,
    o.appliance,
    o.brand,
    o.type,
    o.state,
    o.customer_segment,
    o.base_price,
    o.tax,
    o.discount,
    o.final_price,
    o.status,
    o.created_at
FROM orders o
JOIN customers c ON o.customer_id = c.id;

-- Insert sample data for testing
INSERT INTO customers (first_name, last_name, email, phone) VALUES
('John', 'Doe', 'john.doe@example.com', '555-0101'),
('Jane', 'Smith', 'jane.smith@example.com', '555-0102'),
('Bob', 'Johnson', 'bob.johnson@example.com', '555-0103')
ON DUPLICATE KEY UPDATE id=id;

-- Sample orders
INSERT INTO orders (
    customer_id, manufacturer, appliance, brand, type, state, 
    customer_segment, base_price, tax, discount, final_price, session_id
) VALUES
(1, 'whirlpool', 'washing-machine', 'Cabrio', 'Top Load', 'CA', 'premium', 450.00, 39.38, 67.50, 421.88, 'session_sample_1'),
(2, 'samsung', 'refrigerator', 'Family Hub', 'Smart French Door', 'NY', 'standard', 900.00, 72.00, 45.00, 927.00, 'session_sample_2'),
(3, 'ge', 'dishwasher', 'Profile', 'Built-in', 'TX', 'basic', 320.00, 20.00, 0.00, 340.00, 'session_sample_3')
ON DUPLICATE KEY UPDATE id=id;

-- Create user for the application (will be created by environment variables)
-- The appuser will have access to the database automatically