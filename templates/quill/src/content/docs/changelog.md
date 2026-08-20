---
title: "Changelog"
description: "Release history and updates."
order: 4
section: "reference"
---

## v2.4.0 — December 2024

### Added
- Batch operations API for bulk resource management
- Webhook delivery logs in the dashboard
- Custom metadata fields (up to 50 per resource)

### Changed
- Improved query performance for large datasets
- Updated rate limiting headers to include `X-RateLimit-Reset`

### Fixed
- Pagination cursor inconsistency with filtered results
- Memory leak in long-running WebSocket connections

---

## v2.3.0 — November 2024

### Added
- Real-time event streaming via WebSocket
- Resource versioning with automatic snapshots
- Team collaboration with role-based access

### Changed
- Migrated to new authentication system (JWT tokens)
- Increased max upload size to 100MB

### Deprecated
- v1 API endpoints (sunset: March 2025)
- API key authentication in favor of JWT

---

## v2.2.0 — October 2024

### Added
- GraphQL API endpoint (`/graphql`)
- Resource tagging and filtering
- Export to CSV/JSON formats

### Fixed
- Timeout errors on large file uploads
- Duplicate webhook deliveries under high load

---

## v2.1.0 — September 2024

### Added
- SDK support for Python, Go, and Ruby
- Sandbox environment for testing
- Comprehensive audit logging

### Changed
- Default timeout increased from 3s to 5s
- Improved error messages with request IDs

---

## v2.0.0 — August 2024

### Breaking Changes
- New authentication system (see [Authentication](/docs/authentication))
- Restructured API response format
- Removed deprecated v1 endpoints

### Added
- Complete API redesign with RESTful conventions
- Dashboard with real-time analytics
- SDK for JavaScript/TypeScript
