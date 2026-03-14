# Signup Wizard

Multi-step form with validation, state transitions, and formatted review summary.

## What This Demonstrates

- `bw.raw()` for pre-escaped HTML content (formatted summary)
- `bw.makeStepper()` for step indicator component
- `bw.makeInput()`, `bw.makeSelect()`, `bw.makeCheckbox()` for form elements
- `bw.makeButton()` with onclick handlers that survive re-renders
- `bw.makeAlert()` for informational callouts
- State transitions (step 1 -> 2 -> 3 -> 4)
- Level 1 manual render pattern

## Audience

**Intermediate** — Shows form handling and multi-step navigation patterns.

## Theme

**Wizard** — `#6366f1` (indigo), `#06b6d4` (cyan). Cool, professional palette for form UI.

## How to Run

Open `index.html` in any browser.

```
open examples/wizard/index.html
```

## Architecture

- `step` variable (1-4) controls which step renders
- `formData` object persists user input across steps
- `readField()` / `readChecked()` use `bw.$()` to read form values from DOM
- `saveAndNext()` captures current step's data before advancing
- `renderWizard()` re-renders the entire wizard content on each step change

## Key Patterns to Study

1. **bw.raw()**: Generates formatted `<dl>` summary HTML without double-escaping
2. **onclick survival**: Button onclick handlers in TACO `a:` attributes persist across re-renders
3. **Step state machine**: Simple `step` variable + conditional rendering for each step
4. **Form reading**: `bw.$('#field-id')[0].value` pattern for reading form state
