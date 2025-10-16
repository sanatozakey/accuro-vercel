# Accuro Design Principles - Complete Brand System

## Brand Identity
- **Industry**: Industrial instrumentation & calibration (B2B/B2C)
- **Tone**: Professional, trustworthy, technical yet approachable
- **Target Audience**: Industrial managers, technicians, decision-makers, engineers

## Color System
- **Primary Blue**: #2563EB (CTAs, primary actions, accents)
- **Dark Navy**: #001F3F (hero sections, premium backgrounds, depth)
- **Secondary Blue**: #1D4ED8 (hover states, depth)
- **Light Blue**: #DBEAFE (subtle backgrounds, disabled states)
- **White**: #FFFFFF (primary backgrounds, clarity)
- **Gray Scale**: #F3F4F6 (light bg), #E5E7EB (borders), #9CA3AF (secondary text), #6B7280 (body text), #374151 (dark text)
- **Success**: #10B981 (confirmations, positive feedback)
- **Warning**: #F59E0B (alerts, important notices)
- **Error**: #EF4444 (errors, critical issues)

## Typography System
- **Headings**: Bold, clean sans-serif (conveys authority and precision)
  - H1: 48px (desktop), 32px (mobile) - bold
  - H2: 36px (desktop), 24px (mobile) - bold
  - H3: 28px (desktop), 20px (mobile) - semibold
  - H4: 24px (desktop), 18px (mobile) - semibold
- **Body Text**: 16px (desktop), 14px (mobile) - regular weight
- **Small Text**: 14px (desktop), 12px (mobile) - regular
- **Line Height**: 1.6 for body, 1.4 for headings

## Layout System
- **Max Width**: 1280px (lg breakpoint)
- **Spacing Scale**: 4px unit system (4, 8, 12, 16, 24, 32, 48, 64px)
- **Hero Section**: Full width, dark navy bg, large headline, prominent CTA
- **Content Sections**: Alternating layouts with images, proper whitespace
- **Footer**: Dark background, organized columns, secondary links
- **Responsive Breakpoints**: Mobile-first (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)

## Component Patterns
- **Buttons**:
  - Primary: #2563EB bg, white text, rounded-lg, px-6 py-2.5 minimum
  - Secondary: white bg, #2563EB text, border, rounded-lg
  - Hover: All buttons get color shift (#1D4ED8) with smooth transition
  - Disabled: Gray bg, reduced opacity
  - Mobile: Min 44px height for touch targets
- **Forms**:
  - Inputs: white bg, gray border, focus ring #2563EB, rounded-md, adequate padding
  - Labels: dark gray, required asterisk in red
  - Validation: inline errors in red, success in green
- **Cards**: White bg, subtle border (1px #E5E7EB), shadow-sm, rounded-lg, hover lift effect
- **Navigation**: Sticky navbar, white bg, logo left, menu right, auth buttons right corner

## Accessibility Standards (WCAG 2.1 AA)
- Minimum contrast: 4.5:1 for normal text, 3:1 for large text
- Touch targets: 44x44px minimum on mobile
- Keyboard navigation: Tab order logical, focus visible
- Semantic HTML: Proper heading hierarchy, button/link semantics
- Images: Descriptive alt text
- Forms: Associated labels, clear error messages
