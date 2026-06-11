// Todo List Life Dashboard - Application Logic

// ---------------------------------------------------------------------------
// Storage Utilities
// Wraps localStorage reads/writes with consistent error handling.
// Keys in use: tld_tasks, tld_links
// ---------------------------------------------------------------------------
const storageUtils = {
  /**
   * Serialise `value` to JSON and persist it under `key`.
   * Re-throws any exception raised by localStorage.setItem (e.g. quota
   * exceeded, private-mode block) so the caller can handle it.
   *
   * @param {string} key
   * @param {*} value  — anything JSON-serialisable
   * @throws {DOMException|TypeError} on storage failure
   */
  save(key, value) {
    const json = JSON.stringify(value);
    localStorage.setItem(key, json); // throws on quota / private-mode
  },

  /**
   * Read and deserialise the value stored under `key`.
   * Returns `fallback` when:
   *   - the key does not exist (getItem returns null), or
   *   - the stored string is not valid JSON (SyntaxError from JSON.parse).
   *
   * @param {string} key
   * @param {*} fallback  — returned on miss or parse error
   * @returns {*} parsed value, or fallback
   */
  load(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      // Corrupt / non-JSON data — silently discard and return fallback
      return fallback;
    }
  },
};

// ---------------------------------------------------------------------------
// Greeting Widget
// Displays the current time (12-hour format), date, and a time-of-day
// greeting. Refreshes every 60 seconds via setInterval.
// DOM target: #greeting-widget
// ---------------------------------------------------------------------------

/**
 * Convert a Date object to a 12-hour time string.
 * Hour 0  → "12:xx AM"
 * Hours 1–11  → "1:xx AM" – "11:xx AM"
 * Hour 12 → "12:xx PM"
 * Hours 13–23 → "1:xx PM" – "11:xx PM"
 *
 * @param {Date} date
 * @returns {string}  e.g. "1:30 PM", "12:00 AM"
 */
function formatTime(date) {
  const h24 = date.getHours();
  const minutes = date.getMinutes();

  let hour12;
  if (h24 === 0) {
    hour12 = 12;
  } else if (h24 <= 12) {
    hour12 = h24;
  } else {
    hour12 = h24 - 12;
  }

  const period = h24 < 12 ? 'AM' : 'PM';
  const mm = String(minutes).padStart(2, '0');

  return `${hour12}:${mm} ${period}`;
}

/**
 * Convert a Date object to a human-readable date string.
 *
 * @param {Date} date
 * @returns {string}  e.g. "Monday, 2 June 2025"
 */
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Return the appropriate time-of-day greeting for a given hour (0–23).
 *
 * 05–11  → "Good Morning"
 * 12–17  → "Good Afternoon"
 * 18–20  → "Good Evening"
 * 21–23, 0–4 → "Good Night"
 *
 * @param {number} hours  integer in [0, 23]
 * @returns {"Good Morning"|"Good Afternoon"|"Good Evening"|"Good Night"}
 */
function getGreeting(hours) {
  if (hours >= 5 && hours <= 11) {
    return 'Good Morning';
  } else if (hours >= 12 && hours <= 17) {
    return 'Good Afternoon';
  } else if (hours >= 18 && hours <= 20) {
    return 'Good Evening';
  } else {
    return 'Good Night';
  }
}

const greetingWidget = {
  /** Render immediately, then refresh every 60 seconds. */
  init() {
    this.render();
    setInterval(() => this.render(), 60_000);
  },

  /** Update the greeting widget DOM from the current Date. */
  render() {
    const now = new Date();

    const timeEl = document.getElementById('greeting-time');
    const dateEl = document.getElementById('greeting-date');
    const msgEl = document.getElementById('greeting-text');

    if (timeEl) timeEl.textContent = formatTime(now);
    if (dateEl) dateEl.textContent = formatDate(now);
    if (msgEl) msgEl.textContent = getGreeting(now.getHours());
  },
};

document.addEventListener('DOMContentLoaded', function () {
  greetingWidget.init();
  focusTimer.init();
});

// ---------------------------------------------------------------------------
// Focus Timer
// 25-minute (1500-second) countdown with Start, Stop, and Reset controls.
// Timer state lives only in closure variables — it is NOT persisted to
// localStorage. A page reload always resets to 25:00.
// DOM target: #focus-timer
// ---------------------------------------------------------------------------

/**
 * Convert an integer number of seconds [0–1500] to a zero-padded "MM:SS"
 * string.
 *
 * Examples:
 *   1500 → "25:00"
 *     59 → "00:59"
 *      0 → "00:00"
 *
 * @param {number} seconds  integer in [0, 1500]
 * @returns {string}  e.g. "25:00", "00:59"
 */
function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const focusTimer = (function () {
  // ── Closure-private state ────────────────────────────────────────────────
  let remainingSeconds = 1500; // 25 * 60
  let intervalId = null;       // null = not running
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Decrement remainingSeconds by 1, update the display, and stop + notify
   * when the countdown reaches zero.
   */
  function tickDown() {
    remainingSeconds -= 1;
    const displayEl = document.getElementById('timer-display');
    if (displayEl) {
      displayEl.textContent = formatTimer(remainingSeconds);
    }
    if (remainingSeconds <= 0) {
      focusTimerPublic.stop();
      focusTimerPublic.notifyDone();
    }
  }

  /**
   * Show a browser Notification if permission has been granted, otherwise
   * fall back to the on-page `.timer-alert` banner inside `#focus-timer`.
   */
  function notifyDone() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Focus session complete!');
    } else {
      const alertEl = document.getElementById('timer-alert');
      if (alertEl) {
        alertEl.style.display = '';
      }
    }
  }

  const focusTimerPublic = {
    /**
     * Render "25:00" into #timer-display and bind click listeners to the
     * Start, Stop, and Reset buttons. (Req 3.1)
     */
    init() {
      const displayEl = document.getElementById('timer-display');
      if (displayEl) {
        displayEl.textContent = formatTimer(remainingSeconds);
      }

      const startBtn = document.getElementById('timer-start');
      const stopBtn  = document.getElementById('timer-stop');
      const resetBtn = document.getElementById('timer-reset');

      if (startBtn) startBtn.addEventListener('click', () => this.start());
      if (stopBtn)  stopBtn.addEventListener('click',  () => this.stop());
      if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
    },

    /**
     * Begin the 1-second countdown.
     * Guard: if already running (intervalId !== null), return early. (Req 3.7)
     */
    start() {
      if (intervalId !== null) return; // already running — ignore duplicate (Req 3.7)
      intervalId = setInterval(tickDown, 1000);
    },

    /**
     * Pause the countdown and retain remaining time. (Req 3.4)
     */
    stop() {
      clearInterval(intervalId);
      intervalId = null;
    },

    /**
     * Stop any active countdown and reset remaining time to 25:00. (Req 3.5)
     */
    reset() {
      this.stop();
      remainingSeconds = 1500;
      const displayEl = document.getElementById('timer-display');
      if (displayEl) {
        displayEl.textContent = formatTimer(remainingSeconds); // "25:00"
      }
      // Hide any visible alert banner when the timer is reset
      const alertEl = document.getElementById('timer-alert');
      if (alertEl) {
        alertEl.style.display = 'none';
      }
    },

    /**
     * Notify the user that the focus session is complete. (Req 3.6)
     * Uses browser Notification API if permission is granted; otherwise falls
     * back to the on-page `.timer-alert` banner.
     */
    notifyDone,
  };

  return focusTimerPublic;
})();
