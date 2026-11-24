---
name: claude-design
description: >-
  Principles and actionable guidelines for creating human-centric, aesthetically
  pleasing, elegant, and accessible user interfaces inspired by Claude design philosophy.
---

# Claude Design System & UI/UX Guidelines

This skill guides the creation of calm, elegant, highly usable, and human-friendly digital interfaces.

---

## 1. Core Philosophy

1. **Clarity & Calm**: Reduce visual noise. Every element on screen must have a clear purpose. Avoid unnecessary borders, flashy animations, or visual clutter.
2. **Intentional Whitespace**: Let content breathe. Use generous spacing between sections and comfortable padding inside cards and modals.
3. **Typography Discipline**: Establish a strong hierarchical typographic scale. Use subtle variations in font weight and color rather than excessive font size jumps.
4. **Purposeful Color**: A calm, neutral foundation (slate/zinc) paired with vibrant, semantic accents (emerald for active/good, amber for attention/full, rose for urgent/damaged).
5. **Human-Centric Ergonomics**: Everything must feel natural, touch-friendly, and accessible to anyone regardless of device or ability.

---

## 2. Color Palette & Surface Tokens

- **Backgrounds**:
  - Canvas / Page: `#f8fafc` (subtle warm tint)
  - Surface / Card: `#ffffff` with subtle border `1px solid rgba(226, 232, 240, 0.8)`
  - Elevated / Popups: `#ffffff` with multi-layered soft drop shadow
  - Muted / Secondary: `#f1f5f9`
- **Text & Hierarchy**:
  - Primary / Heading: `#0f172a` (high contrast, crisp)
  - Secondary / Body: `#334155`
  - Muted / Supporting: `#64748b`
  - Subtle / Placeholder: `#94a3b8`
- **Semantic Accents**:
  - Primary / Brand: Emerald (`#059669` hover, `#10b981` base, `#ecfdf5` surface)
  - Info / Maps: Cobalt Blue (`#2563eb` base, `#dbeafe` surface)
  - Warning / Capacity: Amber (`#f59e0b` base, `#fef3c7` surface)
  - Danger / Damaged: Rose/Crimson (`#ef4444` base, `#fee2e2` surface)

---

## 3. Elevation & Shadows

Use realistic, multi-layered ambient light shadows instead of harsh black drops:
- **Subtle (Cards/Buttons)**: `0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)`
- **Medium (Dropdowns/Floating Bars)**: `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`
- **High (Drawers/Modals)**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)`

---

## 4. Components & Micro-interactions

- **Buttons**:
  - Height 36px–40px, rounded corners (`border-radius: 8px` to `10px`).
  - Font weight 600, transitions `150ms cubic-bezier(0.4, 0, 0.2, 1)`.
  - Active state: slight scale `transform: scale(0.98)` or dark tint.
- **Form Controls**:
  - Subtle border, clean focus ring with glowing accent `box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18)`.
  - Clear label with helper texts and accessible validation hints.
- **Badges & Tags**:
  - Pill shape (`border-radius: 9999px`) with small status dot indicator.
  - Soft pastel background with deep colored text for optimal readability.
