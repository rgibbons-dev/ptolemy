/* ============================================
   App Data
   ============================================ */
const APPS = [
  {
    name: "rssed",
    icon: "icons/rssed.svg",
    color: "#fbbf24",
    gradient: "linear-gradient(135deg, #1e293b, #0f172a)",
    url: "#about"
  },
  {
    name: "fridge",
    icon: "icons/fridge.svg",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    url: "#about"
  },
  {
    name: "monsweeper",
    icon: "icons/monsweeper.svg",
    color: "#ffd700",
    gradient: "linear-gradient(135deg, #252842, #1a1b2e)",
    url: "#about"
  },
  {
    name: "diningnote",
    icon: "icons/betterdiningnote.svg",
    color: "#ef4444",
    gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
    url: "#about"
  },
  {
    name: "rolodex",
    icon: "icons/rolodex.svg",
    color: "#14b8a6",
    gradient: "linear-gradient(135deg, #14b8a6, #0d9488)",
    url: "#about"
  },
  {
    name: "workout",
    icon: "icons/workout.svg",
    color: "#4794cd",
    gradient: "linear-gradient(135deg, #4794cd, #2d7ab5)",
    url: "#about"
  },
  {
    name: "cal",
    icon: "icons/cal.svg",
    color: "#6b7280",
    gradient: "linear-gradient(135deg, #6b7280, #4b5563)",
    url: "#about"
  }
];

/* ============================================
   Tab Navigation
   ============================================ */
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

/* ============================================
   App Grid Rendering
   ============================================ */
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
      '<div class="app-icon">' +
        '<img src="' + app.icon + '" alt="' + app.name + '" draggable="false" />' +
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

/* ============================================
   Drag & Drop (reordering)
   ============================================ */
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

  grid.addEventListener("pointerup", function () {
    clearTimeout(longPressTimer);
  });

  grid.addEventListener("pointerleave", function () {
    clearTimeout(longPressTimer);
  });

  // Click outside grid exits jiggle
  document.addEventListener("click", function (e) {
    if (isJiggling && !e.target.closest(".app-grid")) {
      grid.classList.remove("jiggle");
      isJiggling = false;
    }
  });

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

  // Drag end (cleanup)
  grid.addEventListener("dragend", function () {
    grid.querySelectorAll(".app-item").forEach(function (el) {
      el.classList.remove("dragging", "drag-over");
    });
    dragSrcIndex = null;
  });

  // Touch-based reorder support
  initTouchDrag(grid);
}

/* ============================================
   Touch Drag Support
   ============================================ */
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
  }, { passive: true });

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
}

/* ============================================
   Persistence (localStorage)
   ============================================ */
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

/* ============================================
   Init
   ============================================ */
(function init() {
  appOrder = loadOrder();
  renderApps(appOrder);
  initTabs();
  initDrag();
})();
