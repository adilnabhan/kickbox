# Database Schema Draft

This schema is designed for PostgreSQL and can be implemented through Django models, SQLAlchemy models, or raw migrations.

## Main Tables

### users

- id UUID primary key
- full_name varchar not null
- email varchar unique not null
- mobile_number varchar
- password_hash varchar not null
- role enum: admin, fighter, referee
- is_active boolean default true
- created_at timestamp
- updated_at timestamp

### championships

- id UUID primary key
- name varchar not null
- venue varchar
- start_date date
- end_date date
- registration_start date
- registration_end date
- status enum: draft, registration_open, registration_closed, active, completed, cancelled
- created_by UUID references users(id)
- created_at timestamp
- updated_at timestamp

### age_categories

- id UUID primary key
- championship_id UUID references championships(id)
- name varchar not null
- min_age int not null
- max_age int nullable
- created_at timestamp

### weight_categories

- id UUID primary key
- championship_id UUID references championships(id)
- gender enum: male, female
- name varchar not null
- min_weight numeric nullable
- max_weight numeric nullable
- created_at timestamp

### fighter_profiles

- id UUID primary key
- user_id UUID references users(id)
- date_of_birth date not null
- gender enum: male, female, other
- address text
- club_name varchar
- coach_name varchar
- experience_level varchar
- created_at timestamp
- updated_at timestamp

### registrations

- id UUID primary key
- championship_id UUID references championships(id)
- fighter_id UUID references users(id)
- age_category_id UUID references age_categories(id)
- weight_category_id UUID references weight_categories(id)
- weight_kg numeric not null
- status enum: pending, approved, rejected, withdrawn
- rejection_reason text
- reviewed_by UUID references users(id)
- reviewed_at timestamp
- submitted_at timestamp
- updated_at timestamp

### documents

- id UUID primary key
- registration_id UUID references registrations(id)
- document_type enum: passport_photo, identity_proof, medical_certificate, parent_consent
- file_url text not null
- storage_provider varchar
- uploaded_at timestamp

### brackets

- id UUID primary key
- championship_id UUID references championships(id)
- age_category_id UUID references age_categories(id)
- weight_category_id UUID references weight_categories(id)
- gender enum: male, female
- type enum: single_elimination
- status enum: draft, generated, active, completed
- created_at timestamp
- updated_at timestamp

### matches

- id UUID primary key
- bracket_id UUID references brackets(id)
- match_number int not null
- round_name varchar not null
- fighter_a_id UUID references users(id)
- fighter_b_id UUID references users(id)
- winner_id UUID references users(id)
- referee_id UUID references users(id)
- ring_number varchar
- scheduled_at timestamp
- status enum: scheduled, in_progress, completed, cancelled, walkover
- result_type enum: points, knockout, technical_knockout, disqualification, walkover
- score varchar
- next_match_id UUID references matches(id)
- created_at timestamp
- updated_at timestamp

### notifications

- id UUID primary key
- user_id UUID references users(id)
- channel enum: email, sms
- subject varchar
- message text
- status enum: pending, sent, failed
- sent_at timestamp
- created_at timestamp

### audit_logs

- id UUID primary key
- actor_id UUID references users(id)
- entity_type varchar not null
- entity_id UUID not null
- action varchar not null
- metadata jsonb
- created_at timestamp

## Recommended Indexes

- users(email)
- users(role)
- registrations(championship_id, status)
- registrations(age_category_id, weight_category_id)
- brackets(championship_id, age_category_id, weight_category_id, gender)
- matches(bracket_id, round_name)
- matches(referee_id, scheduled_at)
- documents(registration_id, document_type)

