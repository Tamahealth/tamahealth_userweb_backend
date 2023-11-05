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
