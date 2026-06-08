# Software Requirements Specification

## 1. Purpose

This document defines the functional and non-functional requirements for the Kickboxing Championship Management System.

## 2. Scope

The system supports tournament organizers, fighters, and referees. It covers championship creation, registration, category assignment, bracket generation, match scheduling, score entry, notifications, and reporting.

## 3. Functional Requirements

### Authentication and Authorization

- The system shall support JWT-based login.
- The system shall enforce role-based access control for Admin, Fighter, and Referee users.
- The system shall prevent unauthorized access to role-specific dashboards and actions.

### Championship Management

- Admin users shall be able to create championships.
- Admin users shall be able to edit championship name, venue, dates, registration window, and status.
- Admin users shall be able to close registration and start bracket generation.

### Registration

- Fighters shall be able to submit personal and competition information.
- Fighters shall be able to upload passport photo, identity proof, medical certificate, and parent consent form when applicable.
- The system shall calculate or validate fighter age from date of birth.
- The system shall store registration status as pending, approved, rejected, or withdrawn.

### Category Management

- Admin users shall be able to define age categories.
- Admin users shall be able to define male and female weight categories.
- The system shall assign fighters to categories based on age, gender, and weight.
- The system shall flag registrations that do not match an available category.

### Bracket Management

- Admin users shall be able to generate single-elimination brackets by age category, weight category, and gender.
- The system shall support automatic advancement when a fighter has no opponent.
- The system shall create matches for each tournament round.
- The system shall update future matches when winners are submitted.

### Match Management

- Admin users shall be able to assign ring number, match time, and referee.
- Referees shall be able to view assigned matches.
- Referees shall be able to enter scores and submit results.
- Admin users shall be able to review and publish final results.

### Notifications

- The system shall send registration confirmation messages.
- The system shall notify fighters when registrations are approved or rejected.
- The system shall notify fighters and referees about match schedules.
- The system shall send result updates after match completion.

### Reports

- Admin users shall be able to export fighter lists.
- Admin users shall be able to view category-wise registrations.
- Admin users shall be able to view match results.
- Admin users shall be able to generate championship summary and winner reports.

## 4. Non-Functional Requirements

### Usability

- The system shall use a mobile-first responsive interface.
- Common admin actions should be available within two to three clicks from the dashboard.

### Performance

- Dashboard summary pages should load within two seconds for typical tournament data.
- Bracket generation should complete within a few seconds for each category.

### Security

- Passwords must be hashed using a secure one-way algorithm.
- Uploaded documents must be private by default.
- Admin-only operations must be protected by server-side authorization checks.

### Reliability

- Match results should be stored transactionally.
- Bracket advancement should avoid duplicate advancement for the same match.

### Auditability

- The system should track who approved registrations and submitted match results.
- Important status changes should include timestamps.

## 5. Assumptions

- One fighter may register for one category per championship.
- A championship may contain many categories and matches.
- Third-place matches are optional and controlled per championship.

