# Design System Guidelines

## Responsiveness & Mobile-First
- This is a VTU mobile app. The primary target viewport is mobile (375px - 430px).
- Always use a mobile-first approach. Ensure layouts use Tailwind flex/grid with responsive breakpoints (e.g., `grid-cols-2 md:grid-cols-4`).
- Horizontal scrolling on the body element is strictly prohibited (`overflow-x-hidden`).

## UI Elements
- All actionable items (data plan buttons, airtime amount blocks) must have a minimum tap target of 44x44px.
- Use explicit mobile padding constraints (e.g., `px-4 py-2` on mobile, scaling up on desktop).
