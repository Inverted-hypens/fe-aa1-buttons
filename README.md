# Button Lab

An interactive React + TypeScript lab demonstrating `StatefulButton`, an accessible stateful button component that handles multiple asynchronous states (idle, loading, success, error, disabled) with accessible ARIA live announcements, smooth transitions, and reduced motion support.

## Getting Started

### Development
Start the local Vite dev server:
```bash
npm run dev
```

### Testing
Run test suites using Vitest:
```bash
npm test
```

### Build
Check TypeScript types and create a production build:
```bash
npm run build
```

### Lint
Run the Oxlint linter:
```bash
npm run lint
```

## Motion choices

| Interaction | Duration & Easing | Rationale |
| :--- | :--- | :--- |
| **Hover lift + shadow** | `150ms, ease-out` | A reaction to the pointer should start fast and settle gently. |
| **Press** | `80ms, ease-out` | Under ~100ms reads as instant, so the button feels physically pressed. |
| **Focus ring** | `120ms, linear` | Quick fade only. It must never lag behind Tab. |
| **Label / spinner / result swap** | `250ms, ease-in-out (incoming delayed 60ms)` | A-to-B swaps need a symmetric curve. The delay lets the old label leave before the new one arrives, so they don't overlap. |
| **Success check** | `250ms, overshoot curve` | A small pop makes the good outcome feel rewarding without being loud. |
| **Error shake** | `320ms, once` | Long enough to notice, short enough not to nag. Colour, icon and label carry the message after it stops. |
