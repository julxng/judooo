# Changelog

All notable changes to Judooo will be documented in this file.

## [0.1.0.0] - 2026-03-26

### Added
- Curated events page with featured exhibitions funnel to marketplace
- Admin moderation queue with gallery-grouped artwork review
- Plausible analytics custom events and gallery contact admin field
- Newsletter signup component
- OAuth callback route for Supabase auth
- Vitest test framework with initial test suite (23 tests)
- Auth hardening migration: RLS policy preventing role self-escalation, auto-profile creation on signup

### Changed
- Redesigned map view with sticky split-pane layout and scrollable event list
- Redesigned auth dialog to compact shadcn-style with try/finally error handling
- Redesigned admin page with gallery grouping for moderation workflow
- Switched font to Inter and added Vietnamese subset support
- Improved event detail page with clickable artwork cards and tighter line-height
- Improved modal padding with valid design token usage

### Fixed
- Map view rendering by adding missing Leaflet CSS import
- Map crash on events without valid coordinates (added geo-coordinate filter)
- Active map pin styling (added missing `.judooo-map-pin--active` CSS)
- Dead `selectedEvent` variable removed from events directory page
- Open redirect vulnerability in OAuth callback route
- Test admin login restricted to non-production environments
- Admin route removed from public routes list in middleware
