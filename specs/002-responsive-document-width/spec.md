# Feature Specification: Responsive Document Width

**Feature Branch**: `002-responsive-document-width`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Adapter l'espace d'affichage du markdown (la zone où il y a marqué Welcome to Markdit) pour qu'il s'adapte à l'écran. On perd de l'espace."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Document fills available width on wide screens (Priority: P1)

A user opens or edits a Markdown document on a wide monitor. The document
surface (the card that currently shows "Welcome to Markdit") expands to make
better use of the available horizontal space instead of staying pinned to a
narrow fixed-width column, so less of the window is wasted empty surface.

**Why this priority**: This is the core request. The current fixed `48rem`
column wastes a large portion of the viewport on common laptop and desktop
displays, which is the user's primary complaint.

**Independent Test**: Open the app maximized, switch to Read or Edit view, and
confirm the document card grows wider than the previous fixed width while
keeping comfortable side gutters. Delivers immediate value on its own.

**Acceptance Scenarios**:

1. **Given** the app window is wide (≥ 1280 px), **When** the user views a
   document in Read view, **Then** the document surface uses a substantially
   larger share of the main area than the previous fixed `48rem` column, with
   only modest side gutters remaining.
2. **Given** the app window is wide, **When** the user switches to Edit view,
   **Then** the editor surface uses the same responsive width as Read view so
   both modes stay visually consistent.

---

### User Story 2 - Comfortable reading line length is preserved (Priority: P2)

A user reads long-form prose. The document grows to fill space but the text
content does not become so wide that lines are uncomfortable to read.

**Why this priority**: Filling the whole screen edge-to-edge would harm
readability of paragraph text. The width must adapt while still capping
extremely long line lengths within reason.

**Independent Test**: Open a document with long paragraphs on an ultra-wide
display and verify text remains readable (lines do not span the entire monitor
width unbroken).

**Acceptance Scenarios**:

1. **Given** an ultra-wide window (≥ 2000 px), **When** the user reads prose,
   **Then** the document width is capped at a comfortable maximum and stays
   centered with balanced gutters rather than stretching edge-to-edge.

---

### User Story 3 - Small and narrow windows stay usable (Priority: P3)

A user resizes the window narrow or runs on a small display. The document
surface shrinks to fit without horizontal overflow or clipped content.

**Why this priority**: The responsive behavior must not break the existing
small-window experience.

**Independent Test**: Shrink the window to a narrow width and confirm the
document surface fits the main area with consistent padding and no horizontal
scrollbar on the page container.

**Acceptance Scenarios**:

1. **Given** a narrow window, **When** the user views a document, **Then** the
   document surface fits the available width with consistent gutters and no
   horizontal page overflow.

### Edge Cases

- What happens at very small window widths (e.g., 360 px)? Padding scales down
  so content remains readable without overflow.
- How does the surface behave when the sidebar (file explorer) is open versus
  collapsed? The document width adapts to the remaining main-area width in both
  cases.
- Wide content such as tables and fenced code blocks continues to scroll
  horizontally within their own containers rather than forcing the page to
  overflow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The document surface (Read and Edit views) MUST adapt its width to
  the available main-area width instead of using a single small fixed width.
- **FR-002**: On wide viewports, the document surface MUST occupy a
  substantially larger share of the main area than the previous `48rem` column
  while retaining modest side gutters.
- **FR-003**: The document surface MUST cap its maximum content width at a value
  that keeps prose line length comfortable on ultra-wide displays, and stay
  horizontally centered.
- **FR-004**: Read view and Edit view MUST use the same responsive width rules
  so switching modes does not shift the layout.
- **FR-005**: On narrow viewports, the document surface MUST fit the available
  width with no horizontal page overflow and with padding that scales down
  gracefully.
- **FR-006**: Wide inline content (tables, code blocks) MUST keep their own
  horizontal scrolling behavior and MUST NOT cause page-level overflow.
- **FR-007**: The change MUST preserve existing accessibility behavior (focus
  ring, document/region roles, keyboard scrolling) and theme support.

### Key Entities

- **Document surface**: The bordered card containing rendered Markdown (Read
  view, `.markdit-reader`) or the WYSIWYG editor (Edit view, `.markdit-editor`).
  Key attribute changed: horizontal sizing (width, max-width, padding).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a 1440 px-wide window, the document surface content width is at
  least ~40% wider than the previous fixed `48rem` layout.
- **SC-002**: On an ultra-wide (≥ 2000 px) window, the document content width is
  capped (does not stretch edge-to-edge) and remains centered.
- **SC-003**: At all tested window widths from 360 px upward, there is no
  horizontal scrollbar on the page/main container caused by the document
  surface.
- **SC-004**: Read and Edit views render at the same width at every tested
  viewport size.
- **SC-005**: Existing accessibility checks (axe-core) and snapshot/round-trip
  tests continue to pass.

## Assumptions

- The change is purely presentational (CSS) and does not alter Markdown parsing,
  serialization, or component structure.
- A maximum comfortable content width in the range of roughly 70–90 rem is an
  acceptable cap for prose readability; the exact value is an implementation
  detail.
- The main scroll container (`.markdit-main`) keeps its existing padding model;
  the document surface width adapts within it.
- No new user-facing setting is required for v1 (a configurable width toggle is
  out of scope).
