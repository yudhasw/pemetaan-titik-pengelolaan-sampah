---
name: popular-web-designs
description: >-
  Modern web design patterns and leading industry design systems (Stripe, Linear,
  Apple, Vercel, Supabase) for responsive, mobile-first, and geospatial applications.
---

# Popular Web Design Patterns & Industry Standards

This skill captures patterns and best practices from top-tier modern web applications such as Linear, Stripe, Apple, Vercel, and Airbnb.

---

## 1. Leading Design Patterns

1. **Segmented Controls (iOS / Linear style)**:
   - Contained background with a moving pill indicator or active highlighted state.
   - On mobile: icon-only with clear visual cues to preserve space.
   - On desktop: icon + text for rapid recognition.
2. **Slide-over Sheets & Drawers**:
   - Instead of nested menus, modern web apps use a smooth slide-in panel (drawer) from the screen edge with a backdrop blur (`backdrop-filter: blur(4px)`).
   - Group related settings into visually cohesive card clusters.
3. **Floating Map Controls (Google Maps / Uber style)**:
   - Float primary controls (GPS locator, layers, search) directly over the map canvas.
   - Use rounded pills or floating circular action buttons with elevated shadows.
4. **Interactive Autocomplete Search**:
   - Instant response, category dividers (e.g. "Titik Inisiatif" vs "Alamat / Jalan"), custom icons, and keyboard navigation.

---

## 2. Mobile Ergonomics & Compactness

- **Thumb-Friendly Touch Targets**: Minimum 44x44px clickable area, even if visible icon is 16-20px.
- **Header Economy**: Avoid stacking multiple rows of dropdowns on mobile headers. Move secondary filters and settings to a drawer accessible via an icon button (`☰`).
- **Responsive Adaptations**:
  - Desktop: Expanded labels, side-by-side grids, hover states.
  - Mobile: Icon-only buttons, stacked cards, bottom sheets for data entry.

---

## 3. High-Density Geospatial Cards

- Display geographic points with clear hierarchy:
  - Top: Title + Status Badge pill.
  - Middle: Waste category tag, formatted coordinates (monospace font for legibility), address line.
  - Bottom: Quick action bar (View on Map, Edit, Open Google Maps external link).
