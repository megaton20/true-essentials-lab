CREATE TABLE users (
  id VARCHAR PRIMARY KEY,  -- You'll manually generate this in your system
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'student',  -- 'student', 'admin'
  is_email_verified BOOLEAN DEFAULT false,
  referral_code TEXT,
  has_paid BOOLEAN DEFAULT false,
  discount_applied FLOAT DEFAULT 0,
  payment_reference TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



CREATE TABLE referral_codes (
	id VARCHAR PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  location_name TEXT NOT NULL,
  discount_percentage FLOAT NOT NULL,
  max_uses INTEGER NOT NULL,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);


CREATE TABLE class_sessions (
  id VARCHAR PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  meet_link TEXT NOT NULL,
  join_code VARCHAR(12) UNIQUE NOT NULL,
  show_link BOOLEAN DEFAULT FALSE, -- to control visibility
  created_by VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE class_attendance (
  id VARCHAR PRIMARY KEY,
  session_id VARCHAR REFERENCES class_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, user_id)
);