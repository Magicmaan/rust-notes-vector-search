# Feature Specification: Canvas-Rendered Dot Grid Background

**Feature Branch**: `005-grid-background-canvas`  
**Created**: 2026-05-18  
**Status**: Draft  
**Input**: User description: "replace the background with a canvas element that draws dots; research canvas and existing CSS variables"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual dot grid parity with current styling (Priority: P1)

As a user, I see a clean dot-grid background that matches the app theme and no longer shows strange dot artifacts.

**Why this priority**: Fixes current rendering quality issue.

**Independent Test**: Open canvas at default zoom/pan and verify dot spacing, opacity, and tone are consistent with design tokens.

**Acceptance Scenarios**:

1. **Given** the editor is open, **When** the background canvas renders, **Then** dots appear crisp and uniformly spaced.
2. **Given** theme variables change, **When** the background redraws, **Then** dot color/opacity updates without CSS gradient artifacts.

---

### User Story 2 - Dot grid tracks pan/zoom exactly (Priority: P1)

As a user, the dot grid moves and scales consistently with canvas interactions.

**Why this priority**: Background must remain spatially aligned with note placement and future drawing features.

**Independent Test**: Pan and zoom repeatedly; verify grid phase and spacing track transform state without drift.

**Acceptance Scenarios**:

1. **Given** user pans, **When** offsets update, **Then** dots shift smoothly with no jitter.
2. **Given** user zooms in/out, **When** zoom level changes, **Then** dot spacing and opacity respond deterministically.

---

### User Story 3 - Preserve note/UI interaction model (Priority: P2)

As a user, notes remain div-based and interaction behavior is unchanged.

**Why this priority**: User explicitly wants only background moved to canvas, not note rendering.

**Independent Test**: Drag/select/edit notes after migration and confirm interaction parity.

**Acceptance Scenarios**:

1. **Given** notes are rendered as divs, **When** background canvas is introduced, **Then** notes and overlays remain interactive and layered correctly.

### Edge Cases

- High devicePixelRatio displays (retina) causing blurry dots if backing store size is not scaled.
- Very small zoom levels causing overcrowded dots.
- Container resize triggering stale canvas dimensions.
- CSS variables missing/invalid at runtime.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace CSS-gradient dot rendering with a dedicated background `<canvas>` element.
- **FR-002**: System MUST keep notes and UI elements rendered as HTML/div-based layers.
- **FR-003**: System MUST read and apply existing grid-related CSS custom properties for dot appearance where applicable.
- **FR-004**: System MUST synchronize background rendering with viewport pan (`offsetX`, `offsetY`) and zoom (`zoomLevel`) by tracking transform offsets for draw phase calculations.
- **FR-004a**: System MUST place the background canvas inside the transform layer so movement/scaling behavior matches note-space transforms.
- **FR-005**: System MUST render crisply on high-DPI displays using devicePixelRatio-aware canvas sizing.
- **FR-006**: System MUST preserve current non-dot background aesthetics (base tone and vignette/effects), either on canvas or retained overlay layer.
- **FR-007**: System MUST avoid pointer-event interference with note interactions.
- **FR-008**: System MUST keep background rendering performant during interactive pan/zoom.

### Key Entities *(include if feature involves data)*

- **BackgroundCanvasState**: Runtime values for width/height, DPR, zoom, pan offsets, and grid size.
- **DotStyleTokens**: Parsed CSS variable set controlling dot color, radius, fade, opacity bounds, and saturation.
- **BackgroundRenderMetrics**: Derived spacing/phase/alpha values used for each redraw.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dot artifacts reported in current CSS-grid approach are no longer visible in standard usage.
- **SC-002**: During pan/zoom, dot grid visually stays aligned with transformed note space with no observable drift.
- **SC-003**: On DPR 1x and 2x displays, dots remain sharp (no blur caused by canvas backing mismatch).
- **SC-004**: Note interaction regressions count is zero in smoke tests (select/drag/edit/resize).

## Assumptions

- Existing viewport state (`zoomLevel`, `offsetX`, `offsetY`, `gridSize`) remains authoritative.
- The preferred architecture is a background canvas moved into the transform container (background layer up) rather than a static container-level layer.
- Existing CSS variables under `#editor-grid-container` are the styling source of truth unless replaced intentionally.
- Background canvas can be redrawn on animation-frame cadence during active pan/zoom without exceeding acceptable UI latency.