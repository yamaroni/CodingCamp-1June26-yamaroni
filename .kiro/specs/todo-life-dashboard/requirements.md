# Requirements Document

## Introduction

The Todo List Life Dashboard is a standalone, client-side web application that serves as a personal productivity hub. It combines a contextual greeting with the current time and date, a Pomodoro-style focus timer, a persistent to-do list, and a quick-access links panel — all in a single, minimal HTML/CSS/Vanilla JS page backed by the browser's Local Storage API. No server, build tool, or framework is required.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI section that displays the current time, date, and a time-of-day greeting.
- **Focus_Timer**: The UI section that implements a 25-minute countdown timer with start, stop, and reset controls.
- **Task_List**: The UI section that manages a collection of to-do items.
- **Task**: A single to-do item consisting of a text description and a completion state.
- **Quick_Links**: The UI section that manages a collection of user-defined URL shortcuts rendered as clickable buttons.
- **Link**: A single quick-access entry consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API, used as the sole persistence mechanism.
- **Modern_Browser**: Chrome (latest stable), Firefox (latest stable), Edge (latest stable), and Safari (latest stable).

---

## Requirements

### Requirement 1: Project Structure and Technical Constraints

**User Story:** As a developer, I want the project to follow a strict single-file-per-folder convention, so that the codebase remains easy to navigate and maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as exactly one `index.html` file, exactly one CSS file located inside a `css/` directory, and exactly one JavaScript file located inside a `js/` directory, regardless of the number of browsers used during compatibility testing.
2. THE Dashboard SHALL function without a backend server, build tool, or JavaScript framework.
3. THE Dashboard SHALL load and operate correctly in all Modern_Browsers.

---

### Requirement 2: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a personalised greeting when I open the dashboard, so that I immediately know the time of day and feel welcomed.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Greeting_Widget SHALL display the current local time in 12-hour format where hours are converted from 24-hour values (e.g., 13:30 displays as "1:30 PM" and 00:30 displays as "12:30 AM") with an AM/PM indicator.
2. WHEN the Dashboard loads, THE Greeting_Widget SHALL display the current local date in a human-readable format (e.g., "Monday, 2 June 2025").
3. WHILE the Dashboard is open, THE Greeting_Widget SHALL update the displayed time every 60 seconds without requiring a page reload.
4. WHEN the current local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
5. WHEN the current local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
6. WHEN the current local time is between 18:00 and 20:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
7. WHEN the current local time is between 21:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can work in focused Pomodoro-style sessions.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus_Timer SHALL display a countdown initialised to 25:00 (twenty-five minutes, zero seconds).
2. WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down in one-second intervals from the currently displayed remaining time.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time only when a full second has elapsed.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown and reset the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and notify the user via a browser notification or an on-page visual alert.
7. IF the Focus_Timer is already counting down and the user activates the Start control again, THEN THE Focus_Timer SHALL ignore the duplicate activation and continue counting down unchanged.

---

### Requirement 4: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to my to-do list and see them displayed, so that I can track what I need to do.

#### Acceptance Criteria

1. THE Task_List SHALL provide a text input field and an "Add" control for submitting new tasks.
2. WHEN the user submits a non-empty task description, THE Task_List SHALL append a new Task to the list with a completion state of "incomplete".
3. IF the user attempts to submit an empty or whitespace-only task description, THEN THE Task_List SHALL reject the submission and display an inline validation message.
4. WHEN the Dashboard loads, THE Task_List SHALL restore and display all Tasks previously saved in Local_Storage.

---

### Requirement 5: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit an existing task's description, so that I can correct mistakes or update what needs to be done.

#### Acceptance Criteria

1. THE Task_List SHALL provide an "Edit" control for each Task.
2. WHEN the user activates the Edit control for a Task, THE Task_List SHALL present the Task's current description in an editable field.
3. WHEN the user explicitly confirms the edit with a non-empty description, THE Task_List SHALL update the Task's description and persist the change to Local_Storage; any update that bypasses explicit user confirmation SHALL be rejected.
4. IF the user confirms the edit with an empty or whitespace-only description, THEN THE Task_List SHALL reject the update and retain the Task's original description.
5. WHEN the user cancels the edit, THE Task_List SHALL discard any changes and restore the Task to its previous display state.

---

### Requirement 6: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can manage my list accurately.

#### Acceptance Criteria

1. THE Task_List SHALL provide a checkbox or toggle control for each Task to change its completion state.
2. WHEN the user toggles the completion control, THE Task_List SHALL change the Task's completion state between "incomplete" and "complete" and visually distinguish completed tasks (e.g., strikethrough text).
3. WHEN the completion state changes, THE Task_List SHALL persist the updated state to Local_Storage immediately.
4. THE Task_List SHALL provide a "Delete" control for each Task.
5. WHEN the user activates the Delete control for a Task, THE Task_List SHALL remove the Task from the list and from Local_Storage.

---

### Requirement 7: To-Do List — Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that I do not lose them when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a Task is added, edited, completed, or deleted, THE Task_List SHALL attempt to write the full updated task collection to Local_Storage under a defined key; IF the Local_Storage write fails, THEN THE Task_List SHALL block the task operation and display an error message to the user.
2. WHEN the Dashboard loads, THE Task_List SHALL read the task collection from Local_Storage and render all saved Tasks.
3. IF no task data exists in Local_Storage, THEN THE Task_List SHALL render an empty list without errors.

---

### Requirement 8: Quick Links — Add and Display Links

**User Story:** As a user, I want to save favourite website URLs as labelled buttons, so that I can open them with a single click.

#### Acceptance Criteria

1. THE Quick_Links panel SHALL provide a label input field, a URL input field, and an "Add Link" control.
2. WHEN the user submits a Link with a non-empty label and a valid URL, THE Quick_Links panel SHALL add the Link and render it as a clickable button.
3. WHEN the user activates a Link button, THE Quick_Links panel SHALL open the Link's URL in a new browser tab.
4. IF the user submits a Link with an empty label or an empty URL, THEN THE Quick_Links panel SHALL reject the submission and display an inline validation message only after the submission attempt.
5. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Quick_Links panel SHALL reject the submission and display a validation message stating the URL must start with "http://" or "https://" only after the submission attempt.
6. WHEN the Dashboard loads, THE Quick_Links panel SHALL restore and display all Links previously saved in Local_Storage.

---

### Requirement 9: Quick Links — Delete Links

**User Story:** As a user, I want to remove quick links I no longer need, so that the panel stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Quick_Links panel SHALL provide a "Remove" control for each Link button.
2. WHEN the user activates the Remove control for a Link, THE Quick_Links panel SHALL delete the Link from the panel and from Local_Storage.

---

### Requirement 10: Quick Links — Persistence

**User Story:** As a user, I want my quick links to be saved automatically, so that they are available every time I open the dashboard.

#### Acceptance Criteria

1. WHEN a Link is added or removed, THE Quick_Links panel SHALL update the displayed link collection immediately, and SHALL also attempt to write the full updated link collection to Local_Storage under a defined key; IF the Local_Storage write fails, THEN THE Quick_Links panel SHALL display a warning but retain the updated display.
2. WHEN the Dashboard loads, THE Quick_Links panel SHALL read the link collection from Local_Storage and render all saved Links.
3. IF no link data exists in Local_Storage, THEN THE Quick_Links panel SHALL render an empty panel without errors.

---

### Requirement 11: Performance and Responsiveness

**User Story:** As a user, I want the dashboard to feel fast and respond immediately to my actions, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL complete its initial render in under 2 seconds on a modern desktop device with no network requests required after the initial page load.
2. WHEN the user interacts with any control (add, edit, delete, toggle, timer buttons), THE Dashboard SHALL reflect the change in the UI within 100 milliseconds.
3. THE Dashboard SHALL remain usable on viewport widths between 320px and 2560px without horizontal scrolling or overlapping content.

---

### Requirement 12: Visual Design and Accessibility

**User Story:** As a user, I want a clean, readable interface with clear visual hierarchy, so that I can quickly find and use each widget.

#### Acceptance Criteria

1. THE Dashboard SHALL apply a single external stylesheet loaded from the `css/` directory, with at least one font family defined within that stylesheet; inline styles SHALL be used only for dynamic values that cannot be predetermined in CSS.
2. THE Dashboard SHALL maintain a minimum text contrast ratio of 4.5:1 between foreground text and its background for all body-copy text elements, in accordance with WCAG 2.1 AA.
3. THE Dashboard SHALL use no more than two distinct font families across the entire interface.
4. WHEN a control receives keyboard focus, THE Dashboard SHALL display a visible focus indicator on that control.
