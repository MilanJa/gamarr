// Toast notification helper
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// Add to wishlist
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action='add-wishlist']");
  if (!btn) return;

  const appId = btn.dataset.appid;
  const name = btn.dataset.name;
  const headerImage = btn.dataset.image;
  const releaseDate = btn.dataset.release;
  const releaseTs = btn.dataset.releaseTs;
  const releaseTimestamp = releaseTs ? Number(releaseTs) : undefined;

  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: Number(appId), name, headerImage, releaseDate, releaseTimestamp }),
    });

    if (res.ok) {
      btn.className = "btn btn-wishlisted";
      btn.dataset.action = "remove-wishlist";
      btn.disabled = false;
      btn.textContent = "★ Wishlisted";
      showToast(`${name} added to wishlist`);
    } else {
      throw new Error("Failed");
    }
  } catch {
    btn.disabled = false;
    btn.textContent = "☆ Add to Wishlist";
    showToast("Failed to add to wishlist", "error");
  }
});

// Remove from wishlist
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action='remove-wishlist']");
  if (!btn) return;

  const appId = btn.dataset.appid;

  btn.disabled = true;
  btn.textContent = "Removing...";

  try {
    const res = await fetch(`/api/wishlist/${appId}`, { method: "DELETE" });

    if (res.ok) {
      // If on the wishlist page, remove the entire card
      const card = btn.closest(".game-card");
      if (window.location.pathname === "/wishlist" && card) {
        card.style.transition = "opacity 0.3s, transform 0.3s";
        card.style.opacity = "0";
        card.style.transform = "scale(0.95)";
        setTimeout(() => card.remove(), 300);
        showToast("Removed from wishlist");
        // Check if grid is now empty
        setTimeout(() => {
          const grid = document.querySelector(".game-grid");
          if (grid && grid.children.length === 0) {
            grid.outerHTML = `
              <div class="empty-state">
                <h2>Your wishlist is empty</h2>
                <p>Browse upcoming releases and add games you're interested in.</p>
                <a href="/" class="btn btn-search">Browse Upcoming</a>
              </div>`;
          }
        }, 350);
      } else {
        // On the upcoming page, switch back to add button
        btn.className = "btn btn-wishlist";
        btn.dataset.action = "add-wishlist";
        btn.disabled = false;
        btn.textContent = "☆ Add to Wishlist";
        showToast("Removed from wishlist");
      }
    } else {
      throw new Error("Failed");
    }
  } catch {
    btn.disabled = false;
    btn.textContent = "★ Wishlisted";
    showToast("Failed to remove from wishlist", "error");
  }
});

// Sort dropdown
const sortSelect = document.getElementById("sort-select");
if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    const url = new URL(window.location);
    const value = sortSelect.value;
    if (value === "default") {
      url.searchParams.delete("sort");
    } else {
      url.searchParams.set("sort", value);
    }
    url.searchParams.delete("page");
    window.location = url.toString();
  });
}

// Save settings
const settingsForm = document.getElementById("settings-form");
if (settingsForm) {
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const checkboxes = settingsForm.querySelectorAll('input[name="indexerIds"]:checked');
    const indexerIds = Array.from(checkboxes).map((cb) => Number(cb.value));

    const btn = settingsForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      const res = await fetch("/api/settings/indexers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indexerIds }),
      });

      if (res.ok) {
        showToast("Indexer settings saved");
      } else {
        throw new Error("Failed");
      }
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Save Settings";
    }
  });
}

// Save scoring settings
const scoringForm = document.getElementById("scoring-form");
if (scoringForm) {
  scoringForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputs = scoringForm.querySelectorAll("input[type='number']");
    const params = {};
    inputs.forEach((input) => {
      params[input.name] = Number(input.value);
    });

    const btn = scoringForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      const res = await fetch("/api/settings/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        showToast("Scoring settings saved");
      } else {
        throw new Error("Failed");
      }
    } catch {
      showToast("Failed to save scoring settings", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Save Scoring";
    }
  });

  // Reset to defaults
  const resetBtn = document.getElementById("reset-scoring");
  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/settings/scoring/defaults");
        if (!res.ok) throw new Error("Failed");
        const defaults = await res.json();
        const inputs = scoringForm.querySelectorAll("input[type='number']");
        inputs.forEach((input) => {
          if (defaults[input.name] !== undefined) {
            input.value = defaults[input.name];
          }
        });
        showToast("Reset to defaults — click Save to apply");
      } catch {
        showToast("Failed to load defaults", "error");
      }
    });
  }
}

// Steam wishlist import
const importForm = document.getElementById("steam-import-form");
if (importForm) {
  importForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const steamId = document.getElementById("steam-id-input").value.trim();
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      showToast("Enter a valid 17-digit Steam ID", "error");
      return;
    }

    const btn = document.getElementById("import-btn");
    const progress = document.getElementById("import-progress");
    const status = progress.querySelector(".import-status");
    const fill = progress.querySelector(".import-progress-fill");
    const details = progress.querySelector(".import-details");

    btn.disabled = true;
    btn.textContent = "Importing...";
    progress.style.display = "block";
    status.textContent = "Fetching wishlist from Steam and importing games...";
    fill.style.width = "10%";
    details.textContent = "This may take a while due to Steam API rate limits (~1.5s per game).";

    try {
      const res = await fetch("/api/import/steam-wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      fill.style.width = "100%";
      status.textContent = "Import complete!";
      const parts = [];
      if (data.imported > 0) parts.push(`${data.imported} imported`);
      if (data.skipped > 0) parts.push(`${data.skipped} already in wishlist`);
      if (data.failed > 0) parts.push(`${data.failed} failed`);
      details.textContent = `${data.total} games found. ${parts.join(", ")}.`;
      showToast(`Imported ${data.imported} games from Steam wishlist`);
    } catch (err) {
      fill.style.width = "0%";
      status.textContent = "Import failed";
      details.textContent = err.message;
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Import Wishlist";
    }
  });
}
