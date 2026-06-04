# Design Document — Todo List Life Dashboard

## Overview

The Todo List Life Dashboard is a zero-dependency, single-page web application that runs entirely in the browser. There is no server, no build step, and no JavaScript framework. The page consists of four interactive widgets — a Greeting Widget, a Focus Timer, a To-Do List, and a Quick Links panel — all of which persist their state to the browser's `localStorage` API.

The entire application ships as three files:

```
index.html          ← markup and widget structure
css/style.css       ← all styles, responsive layout, WCAG-compliant colours
js/app.js           ← all logic, event handling, localStorage I/O
```

This constraint (one file per folder) deliberately keeps the codebase navigable and maintainable without a build tool.

---

## Architecture

The application follows a simple **module-per-widget** pattern inside a single JavaScript file. Each widget owns its own state, DOM update functions, and localStorage read/write calls. There is no global state object shared across widgets, which keeps each section independently testable and replaceable.

```
┌─────────────────────────────────────────────────────────┐
│                       index.html                        │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │  Greeting Widget │  │       Focus Timer            │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │    To-Do List    │  │       Quick Links            │ │
│  └──────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│       js/app.js      │
│  ┌───────────────┐  │
│  │ greetingWidget│  │
│  ├───────────────┤  │
│  │  focusTimer   │  │
│  ├───────────────┤  │
│  │   taskList    │  │
│  ├───────────────┤  │
│  │  quickLinks   │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  storageUtils │  │
│  └───────────────┘  │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│   Browser APIs      │
│  localStorage       │
│  setInterval        │
│  Date               │
│  window.open        │
└─────────────────────┘
```

**Key architectural decisions:**

- **No frameworks** — keeps load time minimal and avoids version-lock; vanilla DOM APIs are sufficient for this scope.
- **Flat module pattern** — each widget is an IIFE (Immediately Invoked Function Expression) or a plain object with an `init()` method. All four are initialised on `DOMContentLoaded`.
- **localStorage as single source of truth** — tasks and links are always read from localStorage on page load and always written back after every mutation.
- **`setInterval` for clock and timer** — the Greeting Widget uses a 60-second interval; the Focus Timer uses a 1-second interval that is stored in a closure and cleared on Stop/Reset.

---

## Components and Interfaces

### 1. Greeting Widget (`greetingWidget`)

**Responsibility:** Display current time (12-hour format), current date, and a time-of-day greeting. Refresh every 60 seconds.

**DOM target:** `#greeting-widget`

**Public interface:**
```js
greetingWidget.init()   // binds interval, renders immediately
greetingWidget.render() // updates DOM from current Date
```

**Internal helpers:**
```js
formatTime(date)    → "1:30 PM"   // converts Date → 12-hr string
formatDate(date)    → "Monday, 2 June 2025"
getGreeting(hours)  → "Good Morning" | "Good Afternoon" | "Good Evening" | "Good Night"
```

**Greeting rules:**
| Hours range | Greeting       |
|-------------|----------------|
| 05:00–11:59 | Good Morning   |
| 12:00–17:59 | Good Afternoon |
| 18:00–20:59 | Good Evening   |
| 21:00–04:59 | Good Night     |

---

### 2. Focus Timer (`focusTimer`)

**Responsibility:** 25-minute countdown. Start, Stop, Reset buttons. Auto-stop with alert at 00:00.

**DOM target:** `#focus-timer`

**Public interface:**
```js
focusTimer.init()   // renders 25:00, binds button listeners
focusTimer.start()  // begins 1-second interval
focusTimer.stop()   // clears interval, retains remaining time
focusTimer.reset()  // clears interval, resets to 1500 seconds
```

**State (closure-private):**
```js
let remainingSeconds = 1500  // 25 * 60
let intervalId = null        // null = not running
```

**Internal helpers:**
```js
formatTimer(seconds)  → "25:00" | "00:59"  // zero-padded MM:SS
tickDown()            // decrements remainingSeconds, updates DOM, checks 00:00
notifyDone()          // shows browser Notification or on-page alert banner
```

**Guard:** If `intervalId !== null` when Start is clicked, the handler returns early (Requirement 3.7).

---

### 3. To-Do List (`taskList`)

**Responsibility:** Add, edit, toggle completion, and delete tasks. Persist to localStorage.

**DOM target:** `#task-list`

**Public interface:**
```js
taskList.init()                    // loads from storage, renders, binds events
taskList.addTask(description)      // validates, creates Task, saves, renders
taskList.editTask(id, description) // validates, updates Task, saves, renders
taskList.toggleTask(id)            // flips completion state, saves, renders
taskList.deleteTask(id)            // removes Task, saves, renders
```

**Event delegation:** A single `click` listener on the task list container dispatches to `editTask`, `toggleTask`, or `deleteTask` based on `data-action` attributes on buttons.

**Inline validation:** A `<p class="error-msg">` element below the add-input is shown/hidden for empty-input attempts.

---

### 4. Quick Links (`quickLinks`)

**Responsibility:** Add labelled URL buttons, open URLs in a new tab, delete links. Persist to localStorage.

**DOM target:** `#quick-links`

**Public interface:**
```js
quickLinks.init()               // loads from storage, renders, binds events
quickLinks.addLink(label, url)  // validates, creates Link, saves, renders
quickLinks.deleteLink(id)       // removes Link, saves, renders
quickLinks.openLink(url)        // window.open(url, '_blank')
```

**Validation rules:**
- Label must be non-empty (after trimming).
- URL must be non-empty (after trimming) and start with `http://` or `https://`.
- Validation errors are shown inline only after a submission attempt.

---

### 5. Storage Utilities (`storageUtils`)

**Responsibility:** Wrap localStorage reads and writes with error handling.

```js
storageUtils.save(key, value)     // JSON.stringify + localStorage.setItem; throws on quota error
storageUtils.load(key, fallback)  // localStorage.getItem + JSON.parse; returns fallback on miss/error
```

Storage keys:
| Widget     | Key                        |
|------------|----------------------------|
| Task List  | `tld_tasks`                |
| Quick Links| `tld_links`                |

---

## Data Models

### Task

```js
{
  id:          string,   // crypto.randomUUID() or Date.now().toString()
  description: string,   // non-empty, trimmed
  completed:   boolean,  // false on creation
  createdAt:   number    // Date.now() timestamp
}
```

Tasks are stored as a JSON array under the key `tld_tasks`.

### Link

```js
{
  id:    string,  // crypto.randomUUID() or Date.now().toString()
  label: string,  // non-empty, trimmed
  url:   string   // must start with "http://" or "https://"
}
```

Links are stored as a JSON array under the key `tld_links`.

### Focus Timer State

The Focus Timer does **not** persist to localStorage. Its state lives only in memory (closure variables). If the page is reloaded the timer resets to 25:00, which is acceptable per requirements.

### Greeting Widget State

The Greeting Widget has no persistent state — it derives everything from the current `Date` object.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time format is always valid 12-hour

*For any* `Date` object with any hour value (0–23), `formatTime(date)` SHALL return a string matching the pattern `H:MM AM` or `H:MM PM` (or `HH:MM AM` / `HH:MM PM`), where the hour is in the range 1–12 and the period is exactly "AM" or "PM".

**Validates: Requirements 2.1**

---

### Property 2: Greeting maps correctly for all hours

*For any* integer hour value in [0, 23], `getGreeting(hour)` SHALL return exactly one of the four defined greeting strings, and the returned greeting SHALL match the correct time band as specified in Requirements 2.4–2.7. No hour value SHALL produce an undefined or empty result.

**Validates: Requirements 2.4, 2.5, 2.6, 2.7**

---

### Property 3: Timer format is always zero-padded MM:SS

*For any* integer number of seconds in [0, 1500], `formatTimer(seconds)` SHALL return a string in the format `MM:SS` where both MM and SS are zero-padded to two digits and the total value correctly represents the input duration.

**Validates: Requirements 3.1, 3.3**

---

### Property 4: Adding a valid task grows the list by one

*For any* task list of arbitrary length and *any* non-empty, non-whitespace-only description string, calling `taskList.addTask(description)` SHALL increase the number of rendered task items by exactly one, and the new task SHALL appear in the list with `completed = false`.

**Validates: Requirements 4.2**

---

### Property 5: Whitespace-only task descriptions are always rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), calling `taskList.addTask(description)` SHALL leave the task list unchanged and SHALL display a validation error message.

**Validates: Requirements 4.3**

---

### Property 6: Task persistence round trip

*For any* non-empty collection of tasks written to localStorage via `storageUtils.save('tld_tasks', tasks)`, calling `storageUtils.load('tld_tasks', [])` SHALL return a collection that is deeply equal to the saved collection (same IDs, descriptions, completion states, and timestamps).

**Validates: Requirements 7.1, 7.2**

---

### Property 7: Toggle is its own inverse

*For any* task with completion state `s`, toggling it twice SHALL leave it with completion state `s` — i.e., `toggle(toggle(task)).completed === task.completed`.

**Validates: Requirements 6.2, 6.3**

---

### Property 8: Edit with non-empty description always updates, edit with whitespace always rejects

*For any* existing task with description `d` and *any* candidate string `s`:
- If `s.trim()` is non-empty, `taskList.editTask(id, s)` SHALL update the task's description to `s.trim()` and persist the change.
- If `s.trim()` is empty, `taskList.editTask(id, s)` SHALL leave the task's description unchanged at `d`.

**Validates: Requirements 5.3, 5.4**

---

### Property 9: Link URL validation rejects non-HTTP(S) inputs

*For any* string `u` that does not begin with `"http://"` or `"https://"` (case-sensitive), calling `quickLinks.addLink(label, u)` SHALL reject the submission, leave the link collection unchanged, and display a validation message.

**Validates: Requirements 8.5**

---

### Property 10: Link persistence round trip

*For any* non-empty collection of links written to localStorage via `storageUtils.save('tld_links', links)`, calling `storageUtils.load('tld_links', [])` SHALL return a collection deeply equal to the saved collection (same IDs, labels, and URLs).

**Validates: Requirements 10.1, 10.2**

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `localStorage.setItem` throws (quota exceeded or private-mode block) | `storageUtils.save` catches the exception and re-throws it. The calling widget catches it, blocks the mutation, and displays an inline error message to the user. |
| `localStorage.getItem` returns `null` | `storageUtils.load` returns the provided fallback value (empty array `[]` for tasks and links). |
| `JSON.parse` fails on corrupt data | `storageUtils.load` catches the `SyntaxError` and returns the fallback value, silently discarding the corrupt data. |
| Timer reaches 00:00 | `focusTimer.notifyDone()` attempts `new Notification(…)`; if the Notifications API is unavailable or permission is denied, it falls back to an on-page `<div class="timer-alert">` banner. |
| Empty task submission | Input is validated before any state mutation; an inline `<p class="error-msg">` is shown beneath the input. |
| Empty/invalid link submission | Validated before any state mutation; an inline `<p class="error-msg">` is shown beneath the URL input. |
| `window.open` blocked by browser | No additional handling; the browser's own pop-up blocker UI is the fallback. |

---


