# FleetVane Design System & Anti-Slop Guidelines

## Core Principles
- **No AI Slop defaults**: Forbid standard 6-card grids, Inter font, and basic purple/blue SaaS hero gradients.
- **Intentional Components**: Use specific layout structures (e.g. vertical lists, asymmetric grids) instead of generic throwaways.
- **Happy-Path & Beyond**: Always design loading, empty, and error states (e.g. empty states with radial patterns and search cards).

## Color Palette (Strictly Capped)
- **Background**: `#F8FAFC` (Slate 50 - cool light gray)
- **Surface**: `#FFFFFF` (White) and `#0F172A` (Slate 900 for dark mode cards)
- **Primary**: `#2563EB` (Blue 600 - deep electric blue)
- **Text**: `#0F172A` (Slate 900 - dark navy)
- **Status Accents**: 
  - Success/Live: `#059669` (Emerald 600)
  - Pending: `#F59E0B` (Amber 500)
  - Error/Cancelled: `#DC2626` (Red 600)

## Typography
- **Headings**: `Fraunces` (700 weight) for distinct, professional editorial feel.
- **Body**: `DM Sans` (14px/16px, 1.5 line-height) for clean, highly legible data presentation.
- **Monospace (IDs, Data)**: `DM Mono` for shipment IDs and technical readouts.

## Layout & Forms
- **Border Radius**: Exact value of `0.75rem` (`rounded-xl` in Tailwind) for cards and buttons. Avoid pill buttons unless for status badges.
- **Shadows**: Flat and subtle. Example: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` (`shadow-sm`). Never use heavy drop shadows.
- **Card Grids**: Do not use generic 3x2 / 6-card grids for feature sections. Instead, use vertical lists with icons, two-column asymmetric layouts, or numbered sequences.
- **Dark Mode**: Fully in scope. Background: `#020617` (Slate 950), Surfaces: `#0F172A` (Slate 900), Text: `#F8FAFC` (Slate 50).

## Contrast & Accessibility
- **APCA Checked**: Ensure high contrast for text on colored surfaces.
- **Focus Rings**: Strict `#2563EB` solid 2px outline with 2px offset on all interactive elements.
