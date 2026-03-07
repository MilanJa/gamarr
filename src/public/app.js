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

  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: Number(appId), name, headerImage, releaseDate }),
    });

    if (res.ok) {
      btn.className = "btn btn-wishlisted";
      btn.dataset.action = "remove-wishlist";
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
