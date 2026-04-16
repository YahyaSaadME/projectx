# Product Requirements Document (PRD)

## Product Name
LeadPilot AI - Multi-Tenant Lead Management and Sales Automation Platform

## Document Control
- Version: 1.0
- Date: 2026-04-16
- Status: Draft for Implementation
- Primary Audience: Product, Engineering, QA, DevOps, AI Engineering, Design

## 1. Executive Summary
LeadPilot AI is a SaaS platform for organizations that need to capture leads from dynamic forms, classify and score them with AI, assign them intelligently to salespeople, and manage follow-ups, meetings, and performance in one system.

The platform is multi-tenant by design, with strict organization-level data isolation, RBAC, and OAuth-based authentication. The core value proposition is faster lead response, better qualification, and higher conversion using a combined AI + rules workflow engine.

## 2. Problem Statement
Sales teams often lose revenue due to:
- Slow response to inbound leads
- Poor lead qualification
- Manual lead routing and uneven workload
- Missed follow-ups and meeting scheduling delays
- Lack of centralized visibility for admins and owners

Organizations also need flexible form schemas based on their business type (real estate, SaaS, consulting, etc.), which rigid CRMs do not handle well.

## 3. Product Vision
Build a scalable, AI-first lead operations platform that:
- Works for many organizations in a single SaaS deployment
- Adapts to custom lead capture needs through dynamic forms
- Automates lead qualification, prioritization, assignment, and meeting orchestration
- Improves sales productivity and conversion rates through intelligent workflows and analytics

## 4. Goals and Success Metrics

### 4.1 Business Goals
- Reduce lead response time by at least 60%
- Increase qualified lead conversion by at least 20%
- Reduce manual lead assignment effort by at least 80%
- Provide complete visibility of sales activity at organization level

### 4.2 Product KPIs
- Median time-to-first-assignment: under 30 seconds
- Median time-to-first-response: under 5 minutes
- Meeting booking rate from meeting-intent leads: at least 35%
- Follow-up completion rate: at least 90%
- Monthly active organizations retention: at least 85%

### 4.3 Technical KPIs
- API p95 latency under 300 ms (non-AI endpoints)
- AI processing p95 under 8 seconds per lead
- Queue processing success rate at least 99.5%
- Platform uptime target: 99.9%

## 5. Scope

### 5.1 In Scope (V1)
- Multi-tenant organization workspace model
- RBAC with Admin, Owner, Salesperson roles
- Dynamic form builder and public form submission
- MongoDB flexible lead payload storage
- AI classification, scoring, and priority engine
- Smart lead assignment engine
- Meeting scheduling with Google Calendar integration
- Reminder and follow-up scheduling
- Email notification channel
- Dashboard for salesperson and admin views
- Performance tracking metrics
- Dockerized deployment with Redis-backed queues
- OAuth client login and invitation-based onboarding

### 5.2 Out of Scope (V1)
- Native mobile applications
- SMS/WhatsApp notifications (future phase)
- Telephony integration (future phase)
- Advanced BI export suite (future phase)
- Marketplace integrations beyond Google Calendar and email

## 6. Target Users and Personas
- Organization Owner: Creates and controls organization-wide settings, invites users, views overall performance.
- Admin: Operational control, manages users/forms/workflows, can view all leads.
- Salesperson: Handles assigned leads, follow-ups, and meetings.
- Lead (External): Submits forms and receives communication.

## 7. Core Modules and Requirements

## FR-01: Organization Management (Multi-Tenant)
### Description
Each organization has an isolated workspace and data boundary.

### Functional Requirements
- Create organization with owner account.
- Support organization profile (name, domain, timezone, business type).
- Invite members by email.
- Accept or expire invitations.
- Allow role assignment and role updates by owner/admin.
- Enforce tenant isolation on all read/write operations.

### Acceptance Criteria
- Data from one organization is never visible in another organization.
- All tenant-bound collections include orgId.
- Invitations can be revoked and have expiration.
- Audit entries exist for org creation, invites, role changes.

## FR-02: User and Role Management (RBAC)
### Roles
- Owner: Organization-level superuser.
- Admin: Full operational control except ownership transfer.
- Salesperson: Access to assigned leads and own activity.

### Functional Requirements
- Role-based authorization middleware in FastAPI.
- Permission matrix for leads, forms, dashboards, meetings, and users.
- Track salesperson performance metrics.
- Allow owner/admin to deactivate users.

### Acceptance Criteria
- Unauthorized actions return HTTP 403.
- Deactivated users cannot authenticate.
- Salesperson cannot view unassigned leads unless granted explicit permission.

## FR-03: Dynamic Form Builder
### Description
Organizations can create custom lead capture forms with dynamic fields.

### Functional Requirements
- Create/update/publish/unpublish forms.
- Supported field types: text, textarea, email, phone, number, select, multiselect, date, checkbox, radio, boolean.
- Field rules: required, min/max, regex, options, helper text.
- Form versioning and schema history.
- Public embeddable submission endpoint.

### Acceptance Criteria
- Form submissions validate against published schema.
- Form schema changes do not corrupt historical submissions.
- Organization can have multiple forms for different campaigns.

## FR-04: Lead Capture System
### Description
Store form submissions with dynamic schema in MongoDB.

### Functional Requirements
- Persist lead core fields + dynamic payload.
- Attach metadata (source URL, UTM, user agent, IP hash, timestamp).
- Spam prevention baseline: honeypot, rate limiting, optional captcha.
- Lead deduplication check (email/phone and fuzzy name matching).

### Acceptance Criteria
- Submission API responds under 500 ms p95 (without AI processing).
- Duplicate leads are flagged for review/merge.
- Submission failures are retriable and logged.

## FR-05: AI Workflow Agent (Core Engine)
### Description
AI and rules engine that classifies, scores, prioritizes, summarizes, and suggests next action.

### Core Responsibilities
- Lead Classification:
  - Spam detection
  - Genuine inquiry detection
  - Meeting intent detection
  - Information request detection
- Lead Scoring:
  - Budget level
  - Urgency intent
  - Engagement signal strength
- Priority Assignment:
  - High, Medium, Low
- Smart Decisioning:
  - Spam -> Reject
  - Info request -> Auto reply
  - High intent -> Assign to sales
  - Meeting intent -> Trigger booking workflow
- Lead Summary Generation:
  - Generate concise sales-ready summary from raw payload
- Lead Finder:
  - Find related leads (possible duplicates, account-level clusters, or warm similar opportunities)

### Model and Inference Strategy
- Default local model: Gemma 3 1B (or equivalent lightweight model) for baseline classification/summarization.
- Optional stronger summarization model for premium/high-accuracy mode.
- Rule-based fallback when model is unavailable or confidence is below threshold.

### Acceptance Criteria
- Every new lead gets classification, score, and priority.
- Confidence score is stored with model outputs.
- If AI fails, rules fallback still produces a valid action.
- Processing is asynchronous through queue workers.

## FR-06: Smart Lead Assignment Engine
### Description
Automatic lead routing based on business impact and team balance.

### Functional Requirements
- Inputs: lead priority, lead score, salesperson performance, active workload, optional territory/tag match.
- Routing rules:
  - High-value leads -> best performer with available capacity
  - Normal leads -> least busy eligible salesperson
  - Low-priority leads -> queue or round-robin pool
- Reassignment rules for unaccepted/unworked leads after SLA timeout.

### Acceptance Criteria
- Assignment decision is traceable with reason metadata.
- Reassignment occurs automatically after configured timeout.
- Manual override by admin/owner is available and audited.

## FR-07: Meeting Scheduling System
### Description
Automated scheduling flow for meeting-intent or high-value leads.

### Functional Requirements
- Trigger booking link when lead qualifies.
- User selects available time slot.
- Create calendar event through Google Calendar API.
- Invite salesperson and lead via email.
- Apply timezone handling per organization/user.
- Add automatic reminders.

### Acceptance Criteria
- Meetings are created successfully with event IDs stored.
- Double-booking is prevented using slot lock/check.
- Cancellation and reschedule are reflected in platform and calendar.

## FR-08: Reminder and Follow-Up System
### Description
Manages follow-up tasks and meeting reminders.

### Functional Requirements
- Reminder presets: 1 day before, 1 hour before, custom intervals.
- Follow-up tasks linked to lead and owner.
- Dashboard widgets for upcoming and overdue actions.
- Queue-based scheduler with retry strategy.

### Acceptance Criteria
- Reminders trigger at configured time.
- Missed reminders are retried and logged.
- Salesperson dashboard shows upcoming and overdue follow-ups.

## FR-09: Notification System
### Description
Outbound communication channel for transactional updates.

### Functional Requirements
- Email notifications for invites, assignments, reminders, meeting confirmations.
- Template engine with organization branding placeholders.
- Delivery logs and status tracking.
- Node-based mail worker using Nodemailer, connected through queue events.

### Acceptance Criteria
- Delivery status is visible per notification.
- Failed sends retry with exponential backoff.
- Templates are versioned and organization configurable (owner/admin).

## FR-10: Sales Dashboard
### Salesperson View
- Assigned leads
- Lead priority and status
- Upcoming meetings
- Follow-up queue

### Admin/Owner View
- All leads across organization
- Conversion funnel metrics
- Assignment distribution
- Salesperson performance leaderboard

### Acceptance Criteria
- Dashboard data is filtered by tenant and role.
- Metrics update near real-time (target under 1 minute delay).

## FR-11: Performance Tracking
### Metrics
- Deals closed
- Active leads
- Conversion rate
- Average response time
- Meeting-to-deal conversion

### Acceptance Criteria
- Daily aggregation jobs generate accurate snapshots.
- Historical trend charts available by date range.

## FR-12: Dynamic Workflow Engine
### Description
Configurable event-condition-action engine that allows organizations to customize automation logic.

### Functional Requirements
- Event triggers: lead_created, lead_classified, lead_assigned, meeting_created, reminder_due.
- Conditions: priority threshold, score threshold, source, field values, inactivity duration.
- Actions: assign, notify, schedule reminder, send booking link, update status, trigger webhook.
- Workflow versioning and enable/disable controls.

### Acceptance Criteria
- Workflows execute deterministically and are auditable.
- Failed workflow steps are retried or marked with failure reason.
- Admin can test workflow with sample payload before publish.

## 8. Authentication and Identity
### Functional Requirements
- OAuth client login (Google and/or Microsoft as initial providers).
- Account linking for invited users.
- Secure session/JWT token management.
- Organization creation available during first-time login onboarding.
- Invitation acceptance flow ties user to organization membership.

### Acceptance Criteria
- OAuth-only users can complete onboarding and join organization.
- Invitation link cannot be reused after acceptance.
- Tokens rotate and can be revoked on role/user deactivation.

## 9. Data Model (MongoDB)

### Core Collections
- organizations
- users
- memberships
- invitations
- forms
- form_versions
- leads
- lead_events
- lead_scores
- assignments
- meetings
- reminders
- notifications
- workflows
- workflow_runs
- performance_snapshots
- audit_logs

### Key Document Rules
- All tenant-bound documents must contain orgId.
- Store dynamic form data in leads.payload as a flexible object.
- Store AI outputs in leads.ai with modelVersion, confidence, and trace IDs.
- Use soft delete fields where recovery is required.

### Suggested Indexes
- orgId + createdAt (common listing)
- orgId + leadStatus + priority
- orgId + assigneeUserId + followUpAt
- orgId + email/phone for dedupe
- reminders.nextTriggerAt for scheduler
- meetings.startAt for calendar views

## 10. API Requirements (FastAPI)

### Example Endpoint Groups
- Auth: /auth/oauth/login, /auth/oauth/callback, /auth/logout
- Organization: /orgs, /orgs/{orgId}, /orgs/{orgId}/invite
- Membership: /orgs/{orgId}/members, /orgs/{orgId}/roles
- Forms: /forms, /forms/{formId}, /forms/{formId}/publish
- Public Forms: /public/forms/{slug}/submit
- Leads: /leads, /leads/{id}, /leads/{id}/assign, /leads/{id}/status
- Meetings: /meetings, /meetings/{id}/reschedule
- Reminders: /reminders, /reminders/{id}
- Dashboards: /dashboard/salesperson, /dashboard/admin
- Workflows: /workflows, /workflows/{id}/test, /workflows/{id}/toggle

### API Standards
- RESTful JSON APIs
- Pagination for list endpoints
- Structured error format with code and message
- Idempotency key support for submission and invitation APIs

## 11. System Architecture and Stack

### Frontend
- React + Vite + TypeScript
- Tailwind CSS
- Role-aware UI rendering
- Dashboard and workflow builder interfaces

### Backend
- FastAPI (Python)
- Pydantic models and validation
- Async MongoDB driver
- RBAC middleware and tenant enforcement

### Data and Infrastructure
- MongoDB for primary storage
- Redis for cache and queue broker
- Worker service for asynchronous jobs (AI, reminders, notifications, calendar sync)

### AI Layer
- Primary local inference via Gemma 3 1B (or stronger model where required)
- Optional external model for premium summarization quality
- Rule engine fallback mode

### Notification Service
- Node.js worker using Nodemailer for email delivery
- Triggered by queue events from backend

### Containerization (Docker)
Use Docker from day one with standardized images:
- mongo:7
- redis:7-alpine
- ollama/ollama (or equivalent model-serving image)
- backend image based on python:3.12-slim
- worker image based on python:3.12-slim
- notification image based on node:20-alpine
- frontend build image node:20-alpine and runtime nginx:alpine

### Queue Management
- Redis-backed queue
- Background job categories: ai_processing, assignment, reminder_scheduler, calendar_sync, notification_email
- Retry policy with dead-letter handling

## 12. Security and Compliance Requirements
- Strict tenant isolation via orgId enforcement in service/repository layer.
- OAuth-based authentication with secure token lifecycle.
- Passwordless flow supported for OAuth-only users.
- Encrypt data in transit (TLS) and at rest where available.
- Audit logs for sensitive operations (role changes, manual assignment override, workflow edits).
- PII minimization and controlled retention policies.
- Rate limiting and abuse prevention on public submission endpoints.

## 13. Non-Functional Requirements
- Availability: 99.9% monthly for production.
- Scalability: support at least 500 organizations and 1 million leads/year in initial architecture.
- Performance: p95 read APIs under 300 ms; lead ingest endpoint under 500 ms.
- Reliability: at-least-once processing for queue jobs with idempotent handlers.
- Observability: centralized logs, metrics, tracing, and alerting.
- Maintainability: modular services, typed contracts, and API versioning.

## 14. Analytics and Reporting
- Conversion funnel by source/form/campaign.
- Assignment fairness and workload distribution.
- Salesperson leaderboard and trend line.
- Reminder compliance and missed follow-up metrics.
- AI decision quality dashboard (confidence, fallback rate, false positive review queue).

## 15. User Journeys

### Journey A: Owner Onboarding
1. User signs in with OAuth.
2. Creates organization workspace.
3. Configures default form and workflow.
4. Invites team members.

### Journey B: Lead to Meeting
1. Lead submits dynamic form.
2. Lead stored in MongoDB.
3. AI classifies and scores lead.
4. Priority and assignment engine routes lead.
5. Meeting intent triggers booking link.
6. Calendar event created and reminders scheduled.

### Journey C: Sales Execution
1. Salesperson receives assignment email.
2. Views lead summary and next-best action.
3. Executes follow-up.
4. Updates lead status and closes deal.
5. Performance metrics update on dashboard.

## 16. Delivery Plan and Milestones

### Phase 0: Foundation (2 weeks)
- Multi-tenant skeleton, auth, org setup, RBAC baseline
- Docker Compose with MongoDB, Redis, backend, frontend

### Phase 1: Lead Capture Core (3 weeks)
- Dynamic form builder and submission APIs
- Lead storage and dedupe baseline

### Phase 2: AI and Assignment (3 weeks)
- AI workflow pipeline, scoring, priority
- Smart assignment engine and audit trail

### Phase 3: Scheduling and Notifications (2 weeks)
- Google Calendar integration
- Reminder engine and email notification worker

### Phase 4: Dashboards and Performance (2 weeks)
- Admin and salesperson dashboards
- Metrics aggregation and reporting

### Phase 5: Hardening and Launch (2 weeks)
- Security testing, load testing, observability, runbooks
- UAT and production readiness sign-off

## 17. Testing Strategy
- Unit tests for services, scoring logic, RBAC policies.
- Integration tests for API + MongoDB + Redis + queue workers.
- End-to-end tests for onboarding, form submit, assignment, meeting scheduling.
- Contract tests for Google Calendar and notification integrations.
- AI quality tests with labeled lead dataset and regression thresholds.

## 18. Risks and Mitigations
- AI misclassification risk:
  - Mitigation: confidence thresholds, human override, rule fallback.
- Calendar API quota/permission issues:
  - Mitigation: retry strategy, clear error states, health checks.
- Tenant data leakage risk:
  - Mitigation: mandatory org filters, automated security tests.
- Queue backlog growth:
  - Mitigation: autoscaling workers, queue monitoring, dead-letter queues.
- Notification delivery variability:
  - Mitigation: provider retries, suppression list handling, delivery analytics.

## 19. Dependencies
- OAuth provider app credentials (Google/Microsoft)
- Google Calendar API credentials and consent setup
- SMTP provider for Nodemailer
- Model hosting environment for Gemma 3 1B or equivalent
- Production infrastructure for Docker deployment

## 20. Definition of Done (V1)
- All in-scope functional requirements implemented and QA-approved.
- Security and tenant isolation tests pass.
- p95 performance and reliability targets met in staging.
- Monitoring and alerting configured.
- API and operational documentation completed.
- UAT sign-off from product stakeholders.

## 21. Open Questions for Product Finalization
- Which OAuth providers are mandatory at launch: Google only or Google + Microsoft?
- Should low-confidence AI outputs require mandatory manual review?
- Is two-way calendar sync required in V1 or one-way event creation only?
- Is per-organization custom scoring weight configuration required in V1?
- Which email provider (SES, SendGrid, SMTP relay) will be used in production?

## 22. Future Enhancements (Post V1)
- Multi-channel notifications (SMS, WhatsApp, push).
- Native mobile app for salespeople.
- Advanced lead enrichment from third-party data providers.
- Voice call integration and call transcription.
- Revenue forecasting and pipeline prediction models.
