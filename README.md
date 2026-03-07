![RidgeRelay Demo](assets/img/demo/intent.png)
Prototype Scope (What This Demo Includes)

This repository demonstrates a frontend-only prototype of the RidgeRelay concept.
It focuses on user interface design and interaction patterns, rather than full system functionality.

The prototype currently demonstrates:

Trail discovery interface

Activity filtering

Trail detail drawer

Photo gallery

Route preview maps (Leaflet + GeoJSON)

Weather preview using mock JSON data

LocalStorage-based wishlist system

Mobile-first responsive layout

Accessibility-focused navigation patterns

Progressive disclosure of trail information

These components allow the interface and interaction model to be evaluated without requiring backend infrastructure or external services.

What RidgeRelay Intends to Become

The long-term concept for RidgeRelay goes beyond a simple trail browser.

The intended system would focus on intent-aware outdoor safety planning, where users declare trip expectations before entering low-connectivity environments.

The broader vision includes:

Intent-Based Safety Sessions

Users declare:

destination

expected route

planned duration

return expectations

emergency contact(s)

This information establishes a baseline expectation for trip progress.

Guardrails Instead of Tracking

Rather than continuously monitoring location, RidgeRelay would rely on visual and temporal guardrails, such as:

expected time windows

route boundaries

planned checkpoints

This design prioritizes privacy and user autonomy, while still enabling safety planning.

Structured Escalation Model

If a check-in or expected return window is missed, the system would escalate gradually:

Missed check-in reminder

Notification to designated contact

Secondary escalation

Emergency escalation if necessary

This structure reduces false alarms while still providing meaningful safety coverage.

Offline-Friendly Design

The intended system is designed for environments where connectivity may be unreliable.

Future versions could incorporate:

offline map caching

downloadable route data

delayed message syncing

pre-trip planning workflows

Prototype Limitations

This repository does not implement the full RidgeRelay system.

The current version intentionally omits:

backend infrastructure

authentication systems

real-time location tracking

real emergency dispatch integration

contact notification systems

persistent cloud data storage

Weather data is also mocked using local JSON rather than a live API.

These limitations were intentional to keep the project:

aligned with course requirements

deployable as a static site

easy to review academically

Design Constraints

Several constraints guided this implementation.

Academic Scope

This prototype was developed within the context of a university web development course, which emphasized:

semantic HTML

responsive CSS

modular JavaScript

accessible interaction patterns

The focus was on frontend architecture and interface design rather than production-scale infrastructure.

Static Hosting

The site is deployed using GitHub Pages, which means:

no server-side code

no database

no server APIs

All functionality is implemented entirely in the browser.

Privacy-First Demonstration

To avoid collecting personal data or building account systems, the prototype uses:

LocalStorage for saved trails

local JSON files for demo data

This keeps the project transparent and easy to audit.

Future Improvements

If the project were expanded beyond the prototype stage, the following areas would be explored.

Backend Infrastructure

Possible additions:

trip session storage

user accounts

encrypted contact information

event logging for escalation triggers

Offline Capability

Potential improvements:

offline map tile caching

downloadable route packages

pre-trip data synchronization

offline-first session workflows

Safety Session Workflow

A complete RidgeRelay system could include:

trip planning interface

route editing tools

contact configuration

automated check-in scheduling

Expanded Trail Data

Future versions could integrate:

external trail databases

user-contributed route data

hazard reporting

seasonal conditions

Educational Value

This project demonstrates several core web development concepts:

semantic HTML structure

responsive layout systems

modular JavaScript architecture

client-side state management

accessible navigation patterns

component-based UI thinking

It also demonstrates concept-to-prototype system design, where a complex idea is translated into an interactive interface.

Important Note

RidgeRelay is not an emergency system and should not be used for real safety planning.

This prototype exists solely to explore how interface design and structured planning workflows could improve outdoor safety awareness.

Feedback and Discussion

Ideas, critique, and discussion are welcome.

Outdoor safety design is a complex and evolving space, and thoughtful feedback helps improve concepts like RidgeRelay.

If you found the project interesting, consider:

⭐ Starring the repository
💬 Sharing feedback or suggestions
