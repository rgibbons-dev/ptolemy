# Security Audit Report — Ptolemy App Launcher

**Date:** 2026-03-08
**Scope:** Full codebase (read-only assessment)
**Auditor:** Automated (Claude Code)

## Files Reviewed

- `index.html` (56 lines)
- `app.js` (401 lines)
- `style.css` (414 lines)
- `icons/*.svg` (7 files)
- `README.md`

---

## Findings

### Finding 1: DOM-based XSS via `innerHTML` — LOW

**File:** `app.js:104-108`

```js
item.innerHTML =
  '<div class="app-icon">' +
    '<img src="' + app.icon + '" alt="' + app.name + '" draggable="false" />' +
  '</div>' +
  '<span class="app-label">' + app.name + '</span>';
```

`app.icon` and `app.name` are interpolated into `innerHTML` without escaping. Currently the data comes from the hardcoded `APPS` array (lines 4-54), so this is **not exploitable in the current code**. However, if the data source ever changes to user input, an API response, or localStorage, this becomes a stored/DOM XSS vector.

**Exploit scenario:** If `APPS` were ever populated from an external source (API, URL params, user config), an attacker could inject `<img src=x onerror=alert(1)>` via the `name` field.

**SUGGESTION:** Use `textContent` for the label and `setAttribute` for `src`/`alt` instead of string-concatenated `innerHTML`:

```js
var icon = document.createElement('div');
icon.className = 'app-icon';
var img = document.createElement('img');
img.src = app.icon;
img.alt = app.name;
img.draggable = false;
icon.appendChild(img);
var label = document.createElement('span');
label.className = 'app-label';
label.textContent = app.name;
item.appendChild(icon);
item.appendChild(label);
```

---

### Finding 2: DOM-based XSS via `innerHTML` in `renderDots` — LOW

**File:** `app.js:124-126`

```js
function renderDots() {
  var dots = document.getElementById("dock-dots");
  dots.innerHTML = '<div class="dock-dot active"></div>';
}
```

This is a static string with no user input — **not exploitable**. Flagged only for consistency with the innerHTML pattern above.

---

### Finding 3: Weak localStorage validation — LOW

**File:** `app.js:369-383`

```js
function loadOrder() {
  try {
    var saved = localStorage.getItem("ptolemy-app-order");
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed.length === APPS.length) {
        return parsed;
      }
    }
  } catch (e) { }
  return APPS.map(function (_, i) { return i; });
}
```

The validation only checks `parsed.length === APPS.length`. It does not verify that:

- Every element is a valid integer
- Values are within range `[0, APPS.length - 1]`
- There are no duplicates

**Exploit scenario:** A malicious script on the same origin could poison localStorage with `[99, -1, "xss", null, 0, 0, 0]` — length 7 passes validation, but `APPS[99]` is `undefined`, causing `app.url`, `app.icon`, `app.name` to throw or produce `undefined` in the DOM.

**SUGGESTION:** Add bounds and type checking:

```js
if (parsed.length === APPS.length && parsed.every(function(v) {
  return typeof v === 'number' && v >= 0 && v < APPS.length;
})) {
  return parsed;
}
```

---

### Finding 4: Hash-based navigation — INFO (safe)

**File:** `app.js:82-87`

```js
function handleHash() {
  var hash = window.location.hash.replace("#", "");
  if (hash === "about" || hash === "launcher") {
    switchTab(hash);
  }
}
```

The hash value is compared against a strict allowlist (`"about"` or `"launcher"`) before being used. No injection possible.

---

## Negative Findings (No Issues)

| Category | Status |
|----------|--------|
| SQL injection | N/A — no database |
| Command injection | N/A — no server, no `exec`/`child_process` |
| SSRF | N/A — no server-side URL fetching |
| Path traversal | N/A — no file system access |
| Hardcoded secrets | None found |
| JWT/Auth | N/A — no authentication |
| Dependencies/CVEs | N/A — no `package.json` or lockfile; zero dependencies |
| Prototype pollution | No `Object.assign` with untrusted input, no deep merge utilities |
| SSTI/XXE | N/A — no templates or XML parsing |
| SVG injection | Clean — all 7 SVG icons contain no `<script>`, event handlers, or `xlink:href` |
| Prompt injection | N/A — no LLM/agent integration in the app |
| Insecure deserialization | `JSON.parse` on localStorage only; gracefully caught |

---

## Severity-Ranked Summary

| Severity | Count | Finding |
|----------|-------|---------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 0 | — |
| LOW | 3 | innerHTML with string interpolation (×2), weak localStorage validation |
| INFO | 1 | Hash navigation allowlist (safe) |

## Overall Assessment

This is a small, static, client-only site with no external data sources, no dependencies, no server, and no authentication. The attack surface is minimal. The three LOW findings are defense-in-depth recommendations — none are exploitable in the current codebase since all data is hardcoded.
