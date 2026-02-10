RidgeRelay — Intent-Aware Outdoor Safety (Academic Prototype)

RidgeRelay is a calm, safety-first outdoor planning concept designed for low- or no-cell environments.
This prototype is intentionally static (no backend, no accounts) and is locked to a single demo trail:

Rattlesnake Ridge / Rattlesnake Ledge, WA

Built as part of the University of Washington Tacoma T-INFO 230 curriculum, this project explores how:

Intent declaration

Visual guardrails

Progressive escalation

can improve safety awareness for hikers, runners, and solo adventurers — without relying on constant connectivity.

🔗 Live Demo
https://jamdanie.github.io/230CRIDGERELAY/

Why RidgeRelay Exists

Most outdoor safety tools assume:

Always-on GPS

Reliable cellular service

Complex setup during stressful situations

RidgeRelay explores a different direction:

Declare intent before going offline

Use visual boundaries and timing cues instead of reactive alerts

Emphasize prevention and awareness — not panic buttons

This is a conceptual UX + system design prototype, not a production emergency service.

What This Prototype Demonstrates

📍 Intent-based trip planning (time, location, expectations)

🧭 Visual safety boundaries instead of notification overload

📱 Mobile-first layout for real-world outdoor usability

🧠 Human-centered design aligned with HCI principles

⚡ Clean, readable frontend logic suitable for academic review

Design Constraints (Intentional)

No backend services

No real GPS tracking

No accounts or persistent data storage (beyond local demo use)

Frontend-only (HTML, CSS, JavaScript)

These constraints reflect both course requirements and the project’s focus on planning-first safety design.

Tech Stack

HTML

CSS

Vanilla JavaScript

GitHub Pages (deployment)

Design Rationale

RidgeRelay is intentionally designed around core Human–Computer Interaction (HCI) principles rather than feature density.

1. Intent Before Interface

The system prioritizes intent declaration before interaction complexity.
By encouraging users to articulate where they’re going, when they expect to return, and who should be notified, the interface reduces ambiguity and externalizes assumptions.

This supports:

Reduced cognitive load

Clear mental models

Shared situational awareness

2. Progressive Disclosure

Advanced details (gear notes, escalation logic, pet reporting, etc.) are hidden behind expandable panels and tabs.

This ensures:

The primary workflow remains calm and focused

Users are not overwhelmed by excessive options

Complexity appears only when needed

3. Predictable Escalation

Instead of reactive alerts or constant tracking, RidgeRelay demonstrates a progressive escalation model:

Missed check-in → Contact notification → Secondary escalation → Emergency escalation

By making escalation visible and structured, the design reduces panic and replaces guesswork with clarity.

4. Low Cognitive Stress Under Pressure

The interface uses:

Clear typography

High contrast

Limited color accents

Minimal animation

These choices intentionally avoid urgency-driven UI patterns (e.g., flashing alerts or red-heavy interfaces), supporting calm decision-making in outdoor contexts.

5. Constraint-Driven Design

The prototype intentionally avoids:

Backend services

Continuous tracking

Account systems

These constraints emphasize:

Planning over surveillance

Simplicity over feature sprawl

Transparency over hidden processes

Educational Value

This project demonstrates:

Applied HCI principles

Mobile-first UX architecture

Accessible semantic HTML

Modular, readable frontend logic

Concept-to-prototype system thinking

RidgeRelay is not positioned as a replacement for emergency services.
It is an exploration of how clarity, structure, and pre-trip awareness can meaningfully improve safety outcomes in low-connectivity environments.

If you found this project interesting or useful, consider giving it a ⭐
Feedback, critique, and discussion are welcome.
