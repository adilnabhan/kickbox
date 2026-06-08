# API Specification Draft

Base path: `/api/v1`

## Authentication

### POST /auth/register

Create a user account.

### POST /auth/login

Authenticate a user and return JWT access and refresh tokens.

### POST /auth/refresh

Refresh an access token.

### GET /auth/me

Return the authenticated user's profile and role.

## Championships

### GET /championships

List championships.

### POST /championships

Create a championship. Admin only.

### GET /championships/{championship_id}

Get championship details.

### PATCH /championships/{championship_id}

Update championship details. Admin only.

### POST /championships/{championship_id}/publish

Publish or open a championship. Admin only.

## Categories

### GET /championships/{championship_id}/categories

List age and weight categories.

### POST /championships/{championship_id}/age-categories

Create an age category. Admin only.

### POST /championships/{championship_id}/weight-categories

Create a weight category. Admin only.

## Registrations

### POST /championships/{championship_id}/registrations

Submit fighter registration.

### GET /championships/{championship_id}/registrations

List registrations. Admin only.

### GET /registrations/me

List registrations for the authenticated fighter.

### PATCH /registrations/{registration_id}/approve

Approve a fighter registration. Admin only.

### PATCH /registrations/{registration_id}/reject

Reject a fighter registration with a reason. Admin only.

### POST /registrations/{registration_id}/documents

Upload a required document.

## Brackets

### POST /championships/{championship_id}/brackets/generate

Generate brackets by age category, weight category, and gender. Admin only.

### GET /championships/{championship_id}/brackets

List generated brackets.

### GET /brackets/{bracket_id}

Get bracket details and matches.

## Matches

### GET /matches

List matches with filters for championship, referee, status, round, and category.

### GET /matches/{match_id}

Get match details.

### PATCH /matches/{match_id}/schedule

Assign ring, time, and referee. Admin only.

### PATCH /matches/{match_id}/result

Submit match result. Referee or Admin.

Example payload:

```json
{
  "winner_id": "uuid",
  "score": "10-9, 9-10, 10-8",
  "result_type": "points"
}
```

## Reports

### GET /reports/fighters

Export fighter list by championship and category.

### GET /reports/categories

Get category summary report.

### GET /reports/results

Get match result report.

### GET /reports/winners

Get winner report.

## Dashboards

### GET /dashboards/admin

Return admin metrics including total fighters, pending registrations, approved registrations, active matches, and championship statistics.

### GET /dashboards/fighter

Return fighter registration status, category details, upcoming matches, and results.

### GET /dashboards/referee

Return assigned matches and recently submitted results.

