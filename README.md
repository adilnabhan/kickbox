# Kickboxing Championship Management System

A professional web and mobile-responsive platform for managing kickboxing tournaments from fighter registration through bracket generation, match scoring, and winner publication.

## Core Roles

- **Admin**: Manage championships, categories, registrations, brackets, matches, results, and reports.
- **Participant / Fighter**: Register for championships, upload documents, select category, and track matches.
- **Referee**: View assigned matches, enter scores, and submit match outcomes.

## Main Modules

- Championship setup
- Fighter registration and document upload
- Age, gender, and weight category management
- Admin approval workflow
- Tournament bracket generation
- Match scheduling and referee assignment
- Result entry and winner publication
- Email and SMS notifications
- Reports and championship summaries

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- FastAPI or Django
- PostgreSQL
- JWT authentication
- Role-based access control

### Storage and Integrations

- AWS S3 or Cloudinary for document uploads
- Email notifications
- SMS notifications
- Progressive Web App support

## Repository Contents

- [Project overview](docs/PROJECT_OVERVIEW.md)
- [Software requirements specification](docs/SRS.md)
- [Database schema draft](docs/DATABASE_SCHEMA.md)
- [API specification draft](docs/API_SPEC.md)
- [Development roadmap](docs/ROADMAP.md)

## Suggested Architecture

```text
frontend/
  Next.js app for admin, fighter, and referee dashboards

backend/
  FastAPI or Django REST API

database/
  PostgreSQL schema and migrations

storage/
  Cloud document upload integration
```

## Future Features

- Live scoring
- Live streaming integration
- QR code check-in
- Online payment gateway
- Digital certificates
- Ranking system

