# Ptolemy App Launcher — Code Walkthrough

*2026-02-25T02:30:57Z by Showboat 0.6.1*
<!-- showboat-id: 0c118f44-1337-477c-93d9-c1cec2416473 -->

## Overview

This is a zero-build static website — just three files: `index.html`, `style.css`, and `app.js`. No frameworks, no bundlers, no npm. It serves as both a company landing page and a Launchpad-style app launcher where you can click app icons to open them, and drag to rearrange.

The architecture is simple: HTML defines two "views" (Launcher and About) shown one at a time via CSS class toggling. CSS handles all visual design, responsive breakpoints, and animations. JavaScript manages tab switching, dynamic app grid rendering, drag-and-drop reordering, and localStorage persistence.

Let's walk through each layer.

## 1. HTML Structure (`index.html`)

The entire page is a single HTML file. It loads two external assets — `style.css` and `app.js` — and contains no inline scripts or styles. The structure breaks into three main regions: the navbar, the launcher view, and the about view.

### 1.1 The Navbar

The navigation bar is a fixed-position bar with the brand name on the left and two tab buttons on the right. Each button carries a \`data-tab\` attribute that JavaScript reads to know which view to activate.

```bash
sed -n '10,16p' index.html
```

```output
  <nav class="navbar">
    <div class="nav-brand">Ptolemy</div>
    <div class="nav-tabs">
      <button class="nav-tab active" data-tab="launcher">Launcher</button>
      <button class="nav-tab" data-tab="about">About</button>
    </div>
  </nav>
```

The \`active\` class on the Launcher button is the default state — when the page loads, the launcher is the first thing you see. The \`data-tab\` values (\`"launcher"\` and \`"about"\`) correspond directly to the \`id\` attributes on the \`<section>\` elements below.

### 1.2 The Launcher View

The launcher view has three children: a decorative background layer, the main grid container, and a "dock dots" page indicator at the bottom.

```bash
sed -n '19,26p' index.html
```

```output
    <!-- Launcher View -->
    <section id="launcher" class="view active">
      <div class="launcher-bg"></div>
      <div class="launcher-container">
        <div class="app-grid" id="app-grid"></div>
      </div>
      <div class="dock-dots" id="dock-dots"></div>
    </section>
```

The \`app-grid\` div starts empty — it's populated entirely by JavaScript at runtime from the \`APPS\` data array. The \`launcher-bg\` div is a purely decorative element positioned behind everything with \`z-index: -1\` to create the subtle gradient background. The \`dock-dots\` div mimics the iOS home screen page indicator dots.

### 1.3 The About View

The about view is a straightforward content page with a hero section and three info cards.

```bash
sed -n '29,51p' index.html
```

```output
    <section id="about" class="view">
      <div class="about-container">
        <div class="about-hero">
          <h1>Ptolemy</h1>
          <p class="tagline">Building tools that map your world.</p>
        </div>
        <div class="about-content">
          <div class="about-card">
            <h2>Who We Are</h2>
            <p>Ptolemy is a software studio crafting thoughtful, well-designed applications. We believe great software should feel intuitive, look beautiful, and get out of your way so you can focus on what matters.</p>
          </div>
          <div class="about-card">
            <h2>Our Approach</h2>
            <p>Every app we build starts with a real problem. We prototype fast, iterate with care, and ship when it's ready &mdash; not before. Our small team means every decision is intentional.</p>
          </div>
          <div class="about-card">
            <h2>Get In Touch</h2>
            <p>Interested in working with us or have feedback on one of our apps? We'd love to hear from you.</p>
            <a href="mailto:hello@ptolemy.dev" class="contact-link">hello@ptolemy.dev</a>
          </div>
        </div>
      </div>
    </section>
```

The about section has \`class=\"view\"\` but **not** the \`active\` class, so it's hidden by default (\`display: none\`). It only becomes visible when JavaScript toggles the \`active\` class onto it. The three \`about-card\` divs are laid out in a single column on mobile and switch to a 3-column grid on desktop via media queries.

### 1.4 Script Loading

The script tag is placed at the bottom of \`<body>\`, not in \`<head>\`:

```bash
sed -n '54p' index.html
```

```output
  <script src="app.js"></script>
```

This placement ensures the DOM is fully parsed before the script's IIFE runs, so \`document.getElementById\` calls always find their targets without needing a \`DOMContentLoaded\` listener.

## 2. CSS Design System (`style.css`)

### 2.1 Reset and Design Tokens

The stylesheet opens with a universal reset and a set of CSS custom properties on \`:root\` that act as the design token system for the entire site.

```bash
sed -n '4,26p' style.css
```

```output
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --nav-height: 52px;
  --color-bg: #1a1a2e;
  --color-surface: rgba(255, 255, 255, 0.08);
  --color-surface-hover: rgba(255, 255, 255, 0.14);
  --color-text: #f0f0f0;
  --color-text-muted: #a0a0b8;
  --color-accent: #6c63ff;
  --color-accent-glow: rgba(108, 99, 255, 0.35);
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-icon: 22%;
  --shadow-icon: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

Key decisions here:

- **\`--color-bg: #1a1a2e\`** — a dark navy, not pure black. This gives depth and makes the gradient overlays visible.
- **\`--color-surface: rgba(255, 255, 255, 0.08)\`** — cards and surfaces use a semi-transparent white overlay rather than a solid color. Combined with \`backdrop-filter: blur()\`, this creates the frosted-glass look.
- **\`--radius-icon: 22%\`** — a percentage-based border-radius produces the "squircle" shape used by iOS/macOS app icons. It scales naturally with icon size across breakpoints.
- **\`--shadow-icon\`** — a consistent drop shadow token reused by all app icons.
- The \`box-sizing: border-box\` reset prevents padding from expanding element dimensions, which is critical for the grid math to work predictably.

### 2.2 Frosted-Glass Navbar

The navbar uses a combination of semi-transparent background and backdrop blur to create the macOS-style frosted glass effect.

```bash
sed -n '40,55p' style.css
```

```output
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--nav-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: rgba(26, 26, 46, 0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
```

The \`background: rgba(26, 26, 46, 0.82)\` matches \`--color-bg\` but at 82% opacity, letting content blur through. The \`backdrop-filter: blur(18px)\` does the heavy lifting — it blurs whatever is behind the navbar. The \`-webkit-\` prefix is still needed for Safari. The hairline \`border-bottom\` at 6% white opacity provides a subtle separator without looking heavy.

The tab buttons inside the navbar use a pill-shaped segmented control pattern:

```bash
sed -n '64,93p' style.css
```

```output
.nav-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 3px;
}

.nav-tab {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.nav-tab:hover {
  color: var(--color-text);
}

.nav-tab.active {
  background: var(--color-accent);
  color: #fff;
  box-shadow: 0 2px 8px var(--color-accent-glow);
}
```

The \`.nav-tabs\` container has its own subtle background and rounded corners, creating a recessed "track" that the active tab pill slides within. The active tab gets the accent color with a glow shadow, making the current selection unmistakable. The \`font-family: inherit\` on \`.nav-tab\` is needed because \`<button>\` elements don't inherit font by default in most browsers.

### 2.3 View Switching via CSS

The view toggle mechanism is pure CSS class toggling — JavaScript just adds/removes the \`active\` class.

```bash
sed -n '98,111p' style.css
```

```output
main {
  height: 100%;
}

.view {
  display: none;
  height: 100%;
  padding-top: var(--nav-height);
}

.view.active {
  display: flex;
  flex-direction: column;
}
```

All views are \`display: none\` by default. When \`.active\` is added, the view becomes a flex column filling the full viewport height. The \`padding-top: var(--nav-height)\` pushes content below the fixed navbar. Using \`flex-direction: column\` lets the launcher view distribute space: the grid container grows to fill available space (\`flex: 1\`) while the dock dots stay anchored at the bottom.

### 2.4 Launcher Background

The launcher uses a fixed-position decorative layer with layered radial gradients to create a subtle colorful depth effect.

```bash
sed -n '116,124p' style.css
```

```output
.launcher-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(108, 99, 255, 0.15), transparent 60%),
    radial-gradient(ellipse at 70% 80%, rgba(99, 179, 255, 0.1), transparent 60%),
    var(--color-bg);
}
```

Two radial gradients are positioned at opposite corners (upper-left and lower-right) to create a diagonal light effect. The accent purple (\`rgba(108, 99, 255, 0.15)\`) appears top-left and a cooler blue (\`rgba(99, 179, 255, 0.1)\`) appears bottom-right. They're both very low opacity so they blend subtly into the base \`--color-bg\`. The \`z-index: -1\` ensures this decorative layer sits behind all content.

### 2.5 The App Grid

The grid layout uses CSS Grid with fixed-width columns. The icons are centered both within their cells and within the viewport.

```bash
sed -n '126,147p' style.css
```

```output
.launcher-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}

.app-grid {
  display: grid;
  gap: 28px 24px;
  justify-items: center;
  width: 100%;
  max-width: 640px;
}

/* Mobile: 4 columns (phone home screen) */
.app-grid {
  grid-template-columns: repeat(4, 72px);
  justify-content: center;
}
```

The \`.launcher-container\` is a flex child with \`flex: 1\` so it fills all available vertical space. It's also a flex container itself, centering the grid both horizontally and vertically. The \`overflow-y: auto\` ensures scrolling works if there are ever enough apps to overflow.

The grid uses \`repeat(4, 72px)\` — four fixed-width columns. \`justify-content: center\` centers the entire grid block within the container. The gap uses shorthand: \`28px\` vertically between rows, \`24px\` horizontally between columns. With 8 apps in a 4-column grid, you get exactly 2 rows — the classic iOS home screen look.

### 2.6 App Icon Styling

Each app icon has a gradient background, a squircle shape, and a glossy overlay created with an \`::after\` pseudo-element.

```bash
sed -n '152,207p' style.css
```

```output
.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.18s ease;
}

.app-item:active {
  transform: scale(0.9);
}

.app-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-icon);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: var(--shadow-icon);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  position: relative;
  overflow: hidden;
}

.app-icon::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  pointer-events: none;
}

.app-item:hover .app-icon {
  box-shadow: var(--shadow-icon), 0 0 20px rgba(108, 99, 255, 0.3);
  transform: translateY(-2px);
}

.app-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
```

Several details worth highlighting:

- **\`.app-item:active { transform: scale(0.9) }\`** — the "press down" effect you see when tapping an icon on a phone. The \`transition: transform 0.18s\` makes it feel springy rather than instant.
- **\`-webkit-tap-highlight-color: transparent\`** — removes the default blue/gray tap highlight rectangle on mobile WebKit browsers, which would break the illusion.
- **\`user-select: none\`** — prevents text selection when dragging icons around.
- **\`.app-icon::after\`** — this pseudo-element overlays two inset box-shadows: a bright highlight on the top edge and a dark shadow on the bottom edge. This simulates the glossy, beveled look of native app icons. \`pointer-events: none\` ensures it doesn't interfere with clicks.
- **Hover effect** — on desktop, hovering lifts the icon \`2px\` and adds a purple glow shadow, giving tactile feedback.
- **\`.app-label\`** — the \`text-overflow: ellipsis\` with a fixed \`max-width\` truncates long app names with "..." just like a real home screen. The \`text-shadow\` ensures readability against the gradient background.

### 2.7 Jiggle Mode Animation

When the user long-presses or starts dragging, all icons enter "jiggle mode" — the iOS-style wiggle that signals editability.

```bash
sed -n '229,258p' style.css
```

```output
/* ============================================
   Drag & Drop
   ============================================ */
.app-item.dragging {
  opacity: 0.5;
  transform: scale(1.1);
}

.app-item.drag-over {
  transform: scale(0.92);
}

/* Jiggle mode */
.app-grid.jiggle .app-item {
  animation: jiggle 0.25s ease-in-out infinite alternate;
}

.app-grid.jiggle .app-item:nth-child(odd) {
  animation-delay: 0.05s;
}

.app-grid.jiggle .app-item:nth-child(3n) {
  animation-delay: 0.12s;
  animation-direction: alternate-reverse;
}

@keyframes jiggle {
  0%   { transform: rotate(-1.2deg); }
  100% { transform: rotate(1.2deg); }
}
```

The jiggle is controlled by a single class toggle: adding \`jiggle\` to the \`.app-grid\` parent makes all children wiggle. The animation rotates each icon between \`-1.2deg\` and \`1.2deg\` — subtle enough to look natural, not nausea-inducing.

The key to making it look organic is the **staggered timing**: \`:nth-child(odd)\` icons start 50ms late, and every third icon (\`:nth-child(3n)\`) gets a 120ms delay *and* reverses direction. This prevents all 8 icons from rotating in lockstep, which would look mechanical.

The drag visual states are simple: the source item goes semi-transparent at \`opacity: 0.5\` and scales up, while the drop target shrinks slightly to \`scale(0.92)\` to indicate "you can drop here."

### 2.8 Responsive Breakpoints

The layout scales across three breakpoints: mobile (default), tablet (600px+), and desktop (900px+), with a large desktop refinement at 1200px+.

```bash
sed -n '334,407p' style.css
```

```output
@media (min-width: 600px) {
  .app-grid {
    grid-template-columns: repeat(4, 96px);
    gap: 36px 32px;
  }

  .app-icon {
    width: 72px;
    height: 72px;
    font-size: 32px;
  }

  .app-label {
    font-size: 12px;
    max-width: 96px;
  }
}

/* ============================================
   Responsive: Desktop (Launchpad style)
   ============================================ */
@media (min-width: 900px) {
  .launcher-container {
    padding: 48px;
  }

  .app-grid {
    grid-template-columns: repeat(4, 120px);
    gap: 44px 48px;
    max-width: 800px;
  }

  .app-icon {
    width: 88px;
    height: 88px;
    font-size: 40px;
    border-radius: var(--radius-icon);
  }

  .app-label {
    font-size: 13px;
    max-width: 120px;
  }

  .about-hero h1 {
    font-size: 56px;
  }

  .about-content {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ============================================
   Responsive: Large Desktop
   ============================================ */
@media (min-width: 1200px) {
  .app-grid {
    grid-template-columns: repeat(4, 140px);
    gap: 52px 56px;
    max-width: 960px;
  }

  .app-icon {
    width: 96px;
    height: 96px;
    font-size: 44px;
  }

  .app-label {
    font-size: 14px;
    max-width: 140px;
  }
}
```

The scaling progression:

| Breakpoint | Column Width | Icon Size | Gap       | Feel             |
|------------|-------------|-----------|-----------|------------------|
| < 600px    | 72px        | 60x60     | 28px 24px | Phone home screen |
| 600px+     | 96px        | 72x72     | 36px 32px | Tablet            |
| 900px+     | 120px       | 88x88     | 44px 48px | macOS Launchpad   |
| 1200px+    | 140px       | 96x96     | 52px 56px | Large display     |

The column count stays at 4 across all sizes — what changes is the column width, icon dimensions, and spacing. This maintains the home screen metaphor at every size. The about page also responds: the hero title grows from 42px to 56px, and the three cards switch from stacked to a 3-column grid at the 900px breakpoint.

## 3. JavaScript Behavior (`app.js`)

### 3.1 App Data Model

All app metadata lives in a single \`APPS\` array at the top of the file. This is the only place you need to edit to add, remove, or modify apps.

```bash
sed -n '4,11p' app.js
```

```output
const APPS = [
  {
    name: "Atlas",
    icon: "\uD83C\uDF0D",
    color: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    url: "#about"
  },
```

Each app object has five properties:

- **\`name\`** — displayed below the icon as the label
- **\`icon\`** — an emoji character rendered inside the gradient square
- **\`color\`** — the primary color (available for future use, e.g. theming)
- **\`gradient\`** — a CSS gradient string applied directly as the icon's \`background\` style
- **\`url\`** — the navigation target when clicked. Currently all set to \`#about\` which triggers the hash-based tab navigation

There are 8 apps total. Let's see all their names:

```bash
grep 'name:' app.js
```

```output
    name: "Atlas",
    name: "Compass",
    name: "Meridian",
    name: "Orbit",
    name: "Beacon",
    name: "Chronicle",
    name: "Keystone",
    name: "Prism",
```

### 3.2 Tab Navigation and Hash Routing

Tab switching is handled by three functions that form a simple client-side router.

```bash
sed -n '66,94p' app.js
```

```output
function initTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");
      switchTab(target);
    });
  });

  // Handle hash-based navigation
  window.addEventListener("hashchange", handleHash);
  handleHash();
}

function switchTab(target) {
  document.querySelectorAll(".nav-tab").forEach(function (t) {
    t.classList.toggle("active", t.getAttribute("data-tab") === target);
  });
  document.querySelectorAll(".view").forEach(function (v) {
    v.classList.toggle("active", v.id === target);
  });
}

function handleHash() {
  var hash = window.location.hash.replace("#", "");
  if (hash === "about" || hash === "launcher") {
    switchTab(hash);
  }
}
```

The navigation works at two levels:

1. **Direct clicks** — \`initTabs()\` attaches click listeners to both nav buttons. Each reads its \`data-tab\` attribute and passes it to \`switchTab()\`.

2. **Hash changes** — when the URL hash changes (e.g. navigating to \`#about\`), the \`hashchange\` listener fires \`handleHash()\`, which parses the hash and calls \`switchTab()\`. This is what makes app icon clicks work: each icon is an \`<a href=\"#about\">\` link, which changes the hash, which triggers the tab switch.

\`switchTab()\` itself is clean: it iterates all tabs and views, using \`classList.toggle(className, condition)\` to set \`active\` on the matching elements and remove it from the rest — all in a single pass per collection.

The \`handleHash()\` call at the end of \`initTabs()\` handles the case where someone loads the page with a hash already in the URL (e.g. a bookmarked \`index.html#about\`).

### 3.3 Rendering the App Grid

The \`renderApps()\` function takes an ordered array of indices and builds the DOM for the grid.

```bash
sed -n '99,133p' app.js
```

```output
function renderApps(order) {
  var grid = document.getElementById("app-grid");
  grid.innerHTML = "";

  order.forEach(function (index) {
    var app = APPS[index];
    var item = document.createElement("a");
    item.className = "app-item";
    item.href = app.url;
    item.setAttribute("data-index", index);
    item.draggable = true;

    item.innerHTML =
      '<div class="app-icon" style="background: ' + app.gradient + '">' +
        '<span role="img" aria-label="' + app.name + '">' + app.icon + '</span>' +
      '</div>' +
      '<span class="app-label">' + app.name + '</span>';

    item.addEventListener("click", function (e) {
      // If in jiggle mode, don't navigate
      if (grid.classList.contains("jiggle")) {
        e.preventDefault();
      }
    });

    grid.appendChild(item);
  });

  renderDots();
}

function renderDots() {
  var dots = document.getElementById("dock-dots");
  dots.innerHTML = '<div class="dock-dot active"></div>';
}
```

Key details in the rendering:

- **\`order\` is an array of indices**, not the apps themselves. For example, \`[0, 1, 2, 3, 4, 5, 6, 7]\` is the default order, but after dragging it might be \`[2, 0, 1, 3, 7, 4, 5, 6]\`. This indirection is what enables reordering — the \`APPS\` array never mutates; only the index order changes.

- **Each item is an \`<a>\` element** with \`href\` set to the app's URL. This means app launches are just standard link navigation — no JavaScript needed for the core click behavior.

- **\`data-index\`** stores each item's original index in the \`APPS\` array. The drag-and-drop system reads this to know *which* app is being moved.

- **\`item.draggable = true\`** enables the HTML5 Drag and Drop API on desktop browsers.

- **Jiggle mode guard** — the click handler checks if the grid is in jiggle mode. If it is, navigation is suppressed (\`e.preventDefault()\`), so you can rearrange without accidentally opening apps.

- **\`role=\"img\"\` and \`aria-label\`** on the emoji span provide screen reader accessibility for the icon.

\`renderDots()\` adds a single active dot — a cosmetic page indicator. With only 8 apps there's always one page, but the structure is ready for pagination if more apps are added.

### 3.4 Drag & Drop — Desktop (HTML5 API)

The drag system is initialized once by \`initDrag()\` and uses event delegation on the grid container.

```bash
sed -n '138,155p' app.js
```

```output
var appOrder = [];
var dragSrcIndex = null;

function initDrag() {
  var grid = document.getElementById("app-grid");
  var longPressTimer = null;
  var isJiggling = false;

  // Long press to enter jiggle mode (works for touch too)
  grid.addEventListener("pointerdown", function (e) {
    var item = e.target.closest(".app-item");
    if (!item) return;

    longPressTimer = setTimeout(function () {
      grid.classList.add("jiggle");
      isJiggling = true;
    }, 500);
  });
```

Two module-level variables track state: \`appOrder\` (the current index ordering) and \`dragSrcIndex\` (which app is being dragged).

The long-press detection uses a simple timer pattern: on \`pointerdown\`, a 500ms timeout is set. If the user releases (\`pointerup\`) or moves away (\`pointerleave\`) before 500ms, the timeout is cleared and nothing happens. If the timer fires, jiggle mode activates. The \`pointer\` events (not \`mouse\` events) are used because they work for both mouse and touch input.

Now let's see the core drag lifecycle — \`dragstart\`, \`dragover\`, and \`drop\`:

```bash
sed -n '173,239p' app.js
```

```output
  // Drag start
  grid.addEventListener("dragstart", function (e) {
    var item = e.target.closest(".app-item");
    if (!item) return;

    dragSrcIndex = parseInt(item.getAttribute("data-index"), 10);
    item.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";

    // Enter jiggle mode on drag
    grid.classList.add("jiggle");
    isJiggling = true;
  });

  // Drag over
  grid.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    var item = e.target.closest(".app-item");
    // Clear all drag-over states
    grid.querySelectorAll(".app-item").forEach(function (el) {
      el.classList.remove("drag-over");
    });
    if (item) {
      item.classList.add("drag-over");
    }
  });

  // Drag leave
  grid.addEventListener("dragleave", function (e) {
    var item = e.target.closest(".app-item");
    if (item) item.classList.remove("drag-over");
  });

  // Drop
  grid.addEventListener("drop", function (e) {
    e.preventDefault();

    var item = e.target.closest(".app-item");
    if (!item) return;

    var dropIndex = parseInt(item.getAttribute("data-index"), 10);

    if (dragSrcIndex !== null && dragSrcIndex !== dropIndex) {
      // Find positions in the order array
      var fromPos = appOrder.indexOf(dragSrcIndex);
      var toPos = appOrder.indexOf(dropIndex);

      // Remove from old position and insert at new
      appOrder.splice(fromPos, 1);
      appOrder.splice(toPos, 0, dragSrcIndex);

      // Save and re-render
      saveOrder();
      renderApps(appOrder);

      // Keep jiggle mode active after drop
      grid.classList.add("jiggle");
    }

    // Clean up
    grid.querySelectorAll(".app-item").forEach(function (el) {
      el.classList.remove("dragging", "drag-over");
    });
    dragSrcIndex = null;
  });
```

Here's the drag lifecycle:

1. **\`dragstart\`** — records which app is being dragged by reading its \`data-index\`, adds the \`dragging\` class (semi-transparent + scaled up), sets the data transfer to "move" mode, and enters jiggle mode.

2. **\`dragover\`** — the critical \`e.preventDefault()\` is what makes the grid a valid drop target (without it, the browser won't fire the \`drop\` event). It clears \`drag-over\` from all items, then adds it to whichever item the cursor is currently over, producing the "shrink" visual feedback.

3. **\`drop\`** — this is where the reorder happens. It reads the drop target's \`data-index\`, then performs a splice-based reorder on the \`appOrder\` array:
   - \`splice(fromPos, 1)\` removes the dragged app from its current position
   - \`splice(toPos, 0, dragSrcIndex)\` inserts it at the drop target's position
   - After mutation, \`saveOrder()\` persists to localStorage and \`renderApps()\` rebuilds the DOM

All event listeners use **event delegation** — they're attached to the grid container, not to individual items. This means they don't need to be re-attached after \`renderApps()\` destroys and recreates all the DOM nodes.

### 3.5 Touch Drag Support

The HTML5 Drag and Drop API doesn't work on mobile, so \`initTouchDrag()\` implements a custom touch-based equivalent using a floating clone technique.

```bash
sed -n '256,291p' app.js
```

```output
function initTouchDrag(grid) {
  var touchItem = null;
  var touchClone = null;
  var touchStartX, touchStartY;
  var hasMoved = false;
  var touchTimer = null;
  var isDragging = false;

  grid.addEventListener("touchstart", function (e) {
    var item = e.target.closest(".app-item");
    if (!item) return;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    hasMoved = false;
    touchItem = item;

    touchTimer = setTimeout(function () {
      isDragging = true;
      grid.classList.add("jiggle");
      item.classList.add("dragging");

      // Create a floating clone
      touchClone = item.cloneNode(true);
      touchClone.style.position = "fixed";
      touchClone.style.zIndex = "1000";
      touchClone.style.pointerEvents = "none";
      touchClone.style.opacity = "0.85";
      touchClone.style.transform = "scale(1.15)";
      touchClone.style.transition = "none";
      var rect = item.getBoundingClientRect();
      touchClone.style.left = rect.left + "px";
      touchClone.style.top = rect.top + "px";
      touchClone.style.width = rect.width + "px";
      document.body.appendChild(touchClone);
    }, 500);
```

The touch system mirrors the desktop drag but does everything manually:

On \`touchstart\`, a 500ms timer starts (same duration as the pointer long-press). When it fires, the function:
1. Clones the touched DOM element with \`cloneNode(true)\`
2. Positions the clone at the original element's screen coordinates using \`getBoundingClientRect()\`
3. Styles it as \`position: fixed\` so it floats above everything, with \`pointerEvents: none\` so it doesn't interfere with hit-testing
4. Scales it to 115% and sets 85% opacity to visually distinguish it from the grid

Now the touchmove handler — this is the trickiest part:

```bash
sed -n '294,324p' app.js
```

```output
  grid.addEventListener("touchmove", function (e) {
    if (!isDragging || !touchClone) {
      var dx = e.touches[0].clientX - touchStartX;
      var dy = e.touches[0].clientY - touchStartY;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        clearTimeout(touchTimer);
        hasMoved = true;
      }
      return;
    }

    e.preventDefault();
    var touch = e.touches[0];
    var rect = touchItem.getBoundingClientRect();
    touchClone.style.left = (touch.clientX - rect.width / 2) + "px";
    touchClone.style.top = (touch.clientY - rect.height / 2) + "px";

    // Find element under touch
    touchClone.style.display = "none";
    var elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    touchClone.style.display = "";

    grid.querySelectorAll(".app-item").forEach(function (el) {
      el.classList.remove("drag-over");
    });

    var overItem = elemBelow ? elemBelow.closest(".app-item") : null;
    if (overItem && overItem !== touchItem) {
      overItem.classList.add("drag-over");
    }
  }, { passive: false });
```

The touchmove handler has two branches:

**Before drag mode** (the 500ms timer hasn't fired yet): it checks if the finger has moved more than 10 pixels from the start point. If so, it cancels the long-press timer — this distinguishes a scroll gesture from a long-press. This is critical on mobile: without this guard, scrolling would trigger drag mode.

**During drag mode**: it does three things each frame:
1. **Moves the clone** to follow the finger, centered on the touch point
2. **Hit-tests** by temporarily hiding the clone (\`display: none\`), calling \`document.elementFromPoint()\`, then showing it again. This is a standard trick — without hiding the clone, \`elementFromPoint\` would always return the clone itself since it's on top
3. **Applies visual feedback** — adds \`drag-over\` to whatever grid item is under the finger

The \`{ passive: false }\` option is required because the handler calls \`e.preventDefault()\` — without this, Chrome would throw a warning or ignore the preventDefault, causing the page to scroll while dragging.

### 3.6 Touch Drop (touchend)

When the finger lifts, the handler determines the drop target and performs the reorder.

```bash
sed -n '326,370p' app.js
```

```output
  grid.addEventListener("touchend", function () {
    clearTimeout(touchTimer);

    if (isDragging && touchClone) {
      // Find the item we're over
      var cloneRect = touchClone.getBoundingClientRect();
      var cx = cloneRect.left + cloneRect.width / 2;
      var cy = cloneRect.top + cloneRect.height / 2;

      touchClone.style.display = "none";
      var elemBelow = document.elementFromPoint(cx, cy);
      touchClone.style.display = "";

      var overItem = elemBelow ? elemBelow.closest(".app-item") : null;

      if (overItem && overItem !== touchItem) {
        var fromIdx = parseInt(touchItem.getAttribute("data-index"), 10);
        var toIdx = parseInt(overItem.getAttribute("data-index"), 10);
        var fromPos = appOrder.indexOf(fromIdx);
        var toPos = appOrder.indexOf(toIdx);

        appOrder.splice(fromPos, 1);
        appOrder.splice(toPos, 0, fromIdx);
        saveOrder();
        renderApps(appOrder);
        grid.classList.add("jiggle");
      }

      // Cleanup
      if (touchClone.parentNode) {
        touchClone.parentNode.removeChild(touchClone);
      }
      touchClone = null;
    }

    if (touchItem) {
      touchItem.classList.remove("dragging");
    }
    grid.querySelectorAll(".app-item").forEach(function (el) {
      el.classList.remove("drag-over");
    });

    isDragging = false;
    touchItem = null;
  });
```

The \`touchend\` handler does the same hit-test-via-hide trick to find what's under the clone's center point, performs the identical splice-based reorder as the desktop drop handler, then carefully cleans up:
- Removes the clone from the DOM
- Clears all CSS state classes (\`dragging\`, \`drag-over\`)
- Resets all tracking variables to \`null\`/\`false\`

The cleanup is thorough because touch events can end in unexpected ways (e.g. the browser canceling the touch). Leaving stale state would break subsequent interactions.

### 3.7 localStorage Persistence

The app order survives page reloads via two simple functions.

```bash
sed -n '376,398p' app.js
```

```output
function loadOrder() {
  try {
    var saved = localStorage.getItem("ptolemy-app-order");
    if (saved) {
      var parsed = JSON.parse(saved);
      // Validate that it has all indices
      if (parsed.length === APPS.length) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return APPS.map(function (_, i) { return i; });
}

function saveOrder() {
  try {
    localStorage.setItem("ptolemy-app-order", JSON.stringify(appOrder));
  } catch (e) {
    // ignore
  }
}
```

\`loadOrder()\` is defensive: it wraps everything in a \`try/catch\` because localStorage can throw in private browsing mode or when storage is full. It also validates the saved array — if the length doesn't match the current \`APPS\` array (e.g. after adding a new app), it discards the saved order and returns the default \`[0, 1, 2, ..., 7]\`. This prevents index-out-of-bounds errors if the app catalog changes.

\`saveOrder()\` is called after every successful drag-drop reorder. It serializes the index array as JSON. The key \`\"ptolemy-app-order\"\` is namespaced to avoid collisions with other apps on the same domain.

### 3.8 Bootstrap

Everything is kicked off by an immediately-invoked function expression (IIFE) at the bottom of the file.

```bash
sed -n '403,408p' app.js
```

```output
(function init() {
  appOrder = loadOrder();
  renderApps(appOrder);
  initTabs();
  initDrag();
})();
```

The boot sequence is four steps in a specific order:

1. **\`loadOrder()\`** — reads saved order from localStorage (or generates default)
2. **\`renderApps(appOrder)\`** — builds the app grid DOM so everything is visible immediately
3. **\`initTabs()\`** — wires up tab navigation and processes any initial URL hash
4. **\`initDrag()\`** — attaches all drag-and-drop event listeners to the grid

The order matters: \`renderApps\` must run before \`initDrag\` because \`initDrag\` uses event delegation on the grid container (which must exist), though the individual app items don't need to exist yet since delegation handles future elements. \`initTabs\` must run after render so the initial \`handleHash()\` call can correctly show/hide the views.

## 4. How It All Connects

Here's the data flow for the two main user interactions:

**Clicking an app icon:**
\`<a href=\"#about\">\` click → browser updates URL hash → \`hashchange\` event → \`handleHash()\` → \`switchTab(\"about\")\` → CSS class toggle shows about view

**Drag-reordering an app:**
Long press / dragstart → jiggle mode CSS class added → drag over items → drop event → \`appOrder\` array spliced → \`saveOrder()\` to localStorage → \`renderApps()\` rebuilds grid → jiggle mode re-applied

The architecture keeps responsibilities cleanly separated: HTML is pure structure, CSS handles all visual states and transitions, and JavaScript manages data and event wiring. There are no framework dependencies, no build step, and the total payload is three files — ready to deploy by dropping into any static file host.
