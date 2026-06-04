# Implementation Plan: Todo List Life Dashboard

## Overview

Implement a zero-dependency, single-page productivity dashboard in vanilla HTML/CSS/JavaScript. The app ships as three files (`index.html`, `css/style.css`, `js/app.js`) with no build step or framework. Implementation proceeds in dependency order: file scaffold → shared utilities → widgets → integration wiring.

---

## Tasks

- [x] 1. Scaffold project files and HTML structure
  - Create `index.html` with the full page skeleton: `<head>` (charset, viewport, stylesheet link, title), and a `<body>` containing four widget sections with IDs `#greeting-widget`, `#focus-timer`, `#task-list`, and `#quick-links`
  - Each widget section should include placeholder markup for its controls and display areas (time/date/greeting text, timer display + 3 buttons, task add-form + list container, link add-form + links container)
  - Create `css/style.css` (empty file with a comment header)
  - Create `js/app.js` (empty file with a comment header and a `DOMContentLoaded` listener stub)
  - _Requirements: 1.1, 1.2, 12.1_

- [x] 2. Implement `storageUtils` and core data models
  - [x] 2.1 Implement `storageUtils` in `js/app.js`
    - Write `storageUtils.save(key, value)`: calls `JSON.stringify` then `localStorage.setItem`; re-throws any exception (quota exceeded, private-mode block)
    - Write `storageUtils.load(key, fallback)`: calls `localStorage.getItem`; returns `fallback` if result is `null`; wraps `JSON.parse` in a try/catch and returns `fallback` on `SyntaxError`
    - Storage keys used: `tld_tasks`, `tld_links`
    - _Requirements: 7.1, 7.2, 7.3, 10.1, 10.2, 10.3_


- [x] 3. Implement Greeting Widget
  - [x] 3.1 Implement `greetingWidget` helper functions in `js/app.js`
    - Write `formatTime(date)`: converts a `Date` object to a 12-hour string (e.g., `"1:30 PM"`, `"12:00 AM"`); hour 0 → 12, hours 13–23 → 1–11
    - Write `formatDate(date)`: returns a human-readable date string (e.g., `"Monday, 2 June 2025"`) using `toLocaleDateString` with appropriate options or manual day/month arrays
    - Write `getGreeting(hours)`: maps integer hour [0–23] to one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, `"Good Night"` per the defined time bands
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7_



  - [x] 3.3 Implement `greetingWidget.init()` and `greetingWidget.render()` in `js/app.js`
    - `render()`: queries `#greeting-widget` for its time, date, and greeting display elements; calls `formatTime`, `formatDate`, `getGreeting` with `new Date()`; updates their `textContent`
    - `init()`: calls `render()` immediately, then sets a `setInterval` callback to call `render()` every 60 000 ms
    - Wire `greetingWidget.init()` inside the `DOMContentLoaded` listener
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Implement Focus Timer
  - [x] 4.1 Implement `formatTimer` helper and `focusTimer` state in `js/app.js`
    - Write `formatTimer(seconds)`: converts an integer [0–1500] to a `"MM:SS"` zero-padded string (e.g., `1500 → "25:00"`, `59 → "00:59"`, `0 → "00:00"`)
    - Declare closure-private state: `let remainingSeconds = 1500` and `let intervalId = null`
    - _Requirements: 3.1, 3.3_



  - [-] 4.3 Implement `focusTimer.init()`, `start()`, `stop()`, `reset()` and `notifyDone()` in `js/app.js`
    - `init()`: renders `"25:00"` into `#focus-timer`'s display element; binds click listeners to Start, Stop, Reset buttons
    - `start()`: guard — if `intervalId !== null` return early; set `intervalId = setInterval(tickDown, 1000)`
    - `tickDown()`: decrement `remainingSeconds`; update display via `formatTimer`; if `remainingSeconds <= 0` call `stop()` then `notifyDone()`
    - `stop()`: `clearInterval(intervalId); intervalId = null`
    - `reset()`: call `stop()`; set `remainingSeconds = 1500`; update display to `"25:00"`
    - `notifyDone()`: attempt `new Notification('Focus session complete!')` if `Notification.permission === 'granted'`; otherwise show/unhide an on-page `<div class="timer-alert">` banner inside `#focus-timer`
    - Wire `focusTimer.init()` inside `DOMContentLoaded`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 5. Checkpoint — Greeting Widget and Focus Timer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement To-Do List
  - [~] 6.1 Implement task validation and `taskList` state in `js/app.js`
    - Declare `let tasks = []` (populated from `storageUtils.load('tld_tasks', [])` during `init`)
    - Write a private `validateDescription(s)` helper: returns `true` if `s.trim().length > 0`, `false` otherwise
    - Write a private `saveTasks()` helper: calls `storageUtils.save('tld_tasks', tasks)`; if it throws, re-throws so the caller can display an error and block the mutation
    - _Requirements: 4.3, 5.4, 7.1_

  - [~] 6.2 Implement `taskList.addTask(description)` in `js/app.js`
    - Validate with `validateDescription`; if invalid show inline `<p class="error-msg">` beneath the add input and return
    - Create a new Task object: `{ id: crypto.randomUUID(), description: description.trim(), completed: false, createdAt: Date.now() }`
    - Push to `tasks`, call `saveTasks()` (wrap in try/catch to block on storage failure), then call `renderTasks()`
    - _Requirements: 4.1, 4.2, 7.1_



  - [~] 6.4 Implement `taskList.editTask(id, description)` in `js/app.js`
    - Find task by `id`; if `validateDescription(description)` is false, display validation error and return (retain original description)
    - Update `task.description = description.trim()`; call `saveTasks()` (wrap in try/catch); call `renderTasks()`
    - _Requirements: 5.2, 5.3, 5.4_


  - [~] 6.6 Implement `taskList.toggleTask(id)` in `js/app.js`
    - Find task by `id`; flip `task.completed`; call `saveTasks()` (wrap in try/catch); call `renderTasks()`
    - _Requirements: 6.1, 6.2, 6.3_


  - [~] 6.8 Implement `taskList.deleteTask(id)` in `js/app.js`
    - Filter `tasks` to remove the item with matching `id`; call `saveTasks()` (wrap in try/catch); call `renderTasks()`
    - _Requirements: 6.4, 6.5_

  - [~] 6.9 Implement `taskList.renderTasks()` and `taskList.init()` in `js/app.js`
    - `renderTasks()`: clear the `#task-list` container; for each task in `tasks` create a list item with: checkbox (checked state, `data-action="toggle"`, `data-id`), description `<span>` (add strikethrough class if `completed`), Edit button (`data-action="edit"`, `data-id`), Delete button (`data-action="delete"`, `data-id`); if edit mode for a task, replace the span with an `<input>` pre-filled with current description plus Confirm/Cancel buttons
    - Attach a single `click` event listener on the container (event delegation) dispatching by `data-action` to `toggleTask`, `editTask`, or `deleteTask`; handle Cancel to re-render without changes
    - `init()`: load `tasks = storageUtils.load('tld_tasks', [])`; call `renderTasks()`; bind the add-form submit event (Enter key or Add button click) to `addTask`
    - Wire `taskList.init()` inside `DOMContentLoaded`
    - _Requirements: 4.1, 4.4, 5.1, 5.5, 6.1, 6.4, 7.2, 7.3_

- [ ] 7. Checkpoint — To-Do List
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Quick Links
  - [~] 8.1 Implement link validation and `quickLinks` state in `js/app.js`
    - Declare `let links = []` (populated from `storageUtils.load('tld_links', [])` during `init`)
    - Write a private `validateLink(label, url)` helper: returns an error string if label is empty (after trim) or url is empty (after trim) or url does not start with `"http://"` or `"https://"`; returns `null` if valid
    - Write a private `saveLinks()` helper: calls `storageUtils.save('tld_links', links)`; on throw, log a console warning and surface an inline warning message to the user (links panel retains updated display per Req 10.1)
    - _Requirements: 8.4, 8.5, 10.1_

  - [~] 8.2 Implement `quickLinks.addLink(label, url)` in `js/app.js`
    - Call `validateLink`; if error string returned, show inline `<p class="error-msg">` beneath the URL input and return
    - Create a new Link object: `{ id: crypto.randomUUID(), label: label.trim(), url: url.trim() }`
    - Push to `links`, call `saveLinks()`, then call `renderLinks()`
    - _Requirements: 8.1, 8.2, 10.1_



  - [~] 8.4 Implement `quickLinks.deleteLink(id)` and `quickLinks.openLink(url)` in `js/app.js`
    - `deleteLink(id)`: filter `links` to remove item with matching `id`; call `saveLinks()`; call `renderLinks()`
    - `openLink(url)`: call `window.open(url, '_blank')`
    - _Requirements: 9.1, 9.2, 8.3_

  - [~] 8.5 Implement `quickLinks.renderLinks()` and `quickLinks.init()` in `js/app.js`
    - `renderLinks()`: clear the `#quick-links` container's link display area; for each link create a wrapper with: a `<button>` with `link.label` as text (click → `openLink(link.url)`) and a Remove `<button>` (`data-action="remove"`, `data-id`); use event delegation on the container for remove actions
    - `init()`: load `links = storageUtils.load('tld_links', [])`; call `renderLinks()`; bind the add-link form submit event to `addLink`; show validation errors only after a submission attempt (not on blur)
    - Wire `quickLinks.init()` inside `DOMContentLoaded`
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 9.1, 10.2, 10.3_

- [ ] 9. Apply CSS styles and responsive layout
  - [~] 9.1 Write base styles and CSS custom properties in `css/style.css`
    - Define CSS custom properties (`:root`) for colours, spacing, and font sizes; choose a colour palette that meets WCAG 2.1 AA 4.5:1 contrast ratio for all body-copy text
    - Set `font-family` using at most two font families (e.g., a system sans-serif stack + a monospace stack for the timer)
    - Apply a CSS reset/normalise (box-sizing, margin, padding)
    - _Requirements: 12.1, 12.2, 12.3_

  - [~] 9.2 Write widget layout and component styles in `css/style.css`
    - Style the four-widget grid layout using CSS Grid or Flexbox; ensure no horizontal scroll and no overlapping content from 320px to 2560px using `min-width`, `max-width`, and responsive breakpoints
    - Style each widget card (background, border-radius, padding, shadow)
    - Style the timer display with a monospace/larger font; style the task list items (strikethrough for completed tasks); style the link buttons
    - Add a visible `:focus-visible` focus ring on all interactive controls (buttons, inputs, checkboxes)
    - _Requirements: 11.3, 12.2, 12.4, 6.2_

- [ ] 10. Final checkpoint — Full integration
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- Property-based tests require **fast-check** installed in a local test environment (`npm install --save-dev fast-check`); they do not affect the production bundle since there is no build step
- Each task references specific requirements for full traceability
- Checkpoints at tasks 5, 7, and 10 ensure incremental validation before moving to the next phase
- `storageUtils` is the single point of failure for persistence — its error handling must be correct before any widget relies on it
- The Focus Timer state is intentionally non-persistent; a page reload always resets to 25:00

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "4.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "4.2", "6.1", "8.1"] },
    { "id": 3, "tasks": ["4.3", "6.2", "8.2", "9.1"] },
    { "id": 4, "tasks": ["6.3", "6.4", "6.6", "8.3", "8.4", "9.2"] },
    { "id": 5, "tasks": ["6.5", "6.7", "6.8", "8.5"] },
    { "id": 6, "tasks": ["6.9"] }
  ]
}
```
