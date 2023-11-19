-- Create the Users table without the otp_code and otp_expiry columns
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(8) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id),
    UNIQUE (user_id),
    UNIQUE (email),
    UNIQUE (phone_number)
);

-- Creating the US_Addresses table
CREATE TABLE IF NOT EXISTS US_Addresses (
    address_id SERIAL PRIMARY KEY,
    user_id VARCHAR(8) NOT NULL REFERENCES public.users(user_id),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(255) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip VARCHAR(10) NOT NULL,
    country VARCHAR(255) NOT NULL DEFAULT 'United States',
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Creating the International_Addresses table
CREATE TABLE IF NOT EXISTS International_Addresses (
    address_id SERIAL PRIMARY KEY,
    user_id VARCHAR(8) NOT NULL REFERENCES public.users(user_id),
    full_address TEXT NOT NULL,
    city VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    notes TEXT,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Creating the Prescriptions table
CREATE TABLE IF NOT EXISTS Prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    user_id VARCHAR(8) NOT NULL REFERENCES users(user_id),
    us_address_id INT,
    international_address_id INT,
    prescription_file_url TEXT,
    prescriber_name VARCHAR(255) NOT NULL,
    prescriber_institution VARCHAR(255) NOT NULL,
    prescriber_phone VARCHAR(50),
    prescriber_email VARCHAR(255),
    notes TEXT,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_us_address FOREIGN KEY (us_address_id) REFERENCES US_Addresses(address_id),
    CONSTRAINT fk_international_address FOREIGN KEY (international_address_id) REFERENCES International_Addresses(address_id)
);

-- Creating the Payments table
-- Creating the Payments table
CREATE TABLE IF NOT EXISTS Payments (
    payment_id SERIAL PRIMARY KEY,
    user_id VARCHAR(8) NOT NULL,
    service_id INT NOT NULL,
    amount DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_payment_id VARCHAR(255),
    payment_status VARCHAR(50), -- e.g., successful, failed
    receipt_url VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (service_id) REFERENCES Services(service_id)
);

-- Function to automatically update modified_date
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.modified_date = now();
   RETURN NEW;   
END;
$$ language 'plpgsql';

-- Trigger to use update_modified_column function before an update operation
CREATE TRIGGER update_payment_modified_date BEFORE UPDATE
ON Payments FOR EACH ROW EXECUTE PROCEDURE 
update_modified_column();




-- creating the Services table
CREATE TABLE IF NOT EXISTS Services (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);


-- creating the Orders table
CREATE TABLE IF NOT EXISTS Orders (
    order_id SERIAL PRIMARY KEY,
    user_id VARCHAR(8) NOT NULL REFERENCES users(user_id),
    prescription_id INT NOT NULL REFERENCES Prescriptions(prescription_id),
    payment_id INT NOT NULL REFERENCES Payments(payment_id),
    order_status VARCHAR(50) DEFAULT 'pending',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to automatically update modified_date
CREATE OR REPLACE FUNCTION update_order_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.modified_date = now();
   RETURN NEW;   
END;
$$ language 'plpgsql';


-- Trigger to use update_order_modified_column function before an update operation
CREATE TRIGGER update_order_modified_date BEFORE UPDATE
ON Orders FOR EACH ROW EXECUTE PROCEDURE 
update_order_modified_column();
