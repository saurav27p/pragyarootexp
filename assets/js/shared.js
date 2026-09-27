(function(){
  "use strict";
  var $ = function(selector, root){ return (root || document).querySelector(selector); };
  var $$ = function(selector, root){ return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var storageKey = "pragyaroot-exp-theme";
  var lastFocus = null;

  function applyTheme(theme){
    document.documentElement.dataset.theme = theme;
    var button = $("[data-theme-toggle]");
    if (button) {
      button.setAttribute("aria-label", theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance");
      button.setAttribute("title", theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance");
    }
  }
  function initTheme(){
    var saved = null;
    try { saved = localStorage.getItem(storageKey); } catch (e) {}
    applyTheme(saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
    var toggle = $("[data-theme-toggle]");
    if (toggle) toggle.addEventListener("click", function(){
      var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(storageKey, next); } catch (e) {}
    });
  }
  function initHeader(){
    var header = $("[data-header]");
    var menuButton = $("[data-menu-toggle]");
    var menu = $("[data-mobile-menu]");
    function closeMenu(){ if (!menu) return; menu.hidden = true; menuButton.setAttribute("aria-expanded", "false"); }
    if (menuButton && menu) menuButton.addEventListener("click", function(){ var open = menu.hidden; menu.hidden = !open; menuButton.setAttribute("aria-expanded", String(open)); });
    $$(".mobile-menu a").forEach(function(link){ link.addEventListener("click", closeMenu); });
    if (header) window.addEventListener("scroll", function(){ header.classList.toggle("is-scrolled", window.scrollY > 8); }, {passive:true});
  }
  function initTabs(){
    var tabs = $$("[data-tab]");
    tabs.forEach(function(tab, index){
      tab.addEventListener("click", function(){
        var name = tab.dataset.tab;
        tabs.forEach(function(item){ var active = item === tab; item.classList.toggle("is-active", active); item.setAttribute("aria-selected", String(active)); item.tabIndex = active ? 0 : -1; });
        $$("[data-panel]").forEach(function(panel){ var active = panel.dataset.panel === name; panel.classList.toggle("is-active", active); panel.hidden = !active; });
      });
      tab.addEventListener("keydown", function(event){ if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return; event.preventDefault(); var next = tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length]; next.focus(); next.click(); });
    });
  }
  function openSearch(){
    var dialog = $("[data-search-dialog]");
    var input = $("[data-search-input]");
    if (!dialog) return;
    lastFocus = document.activeElement;
    dialog.hidden = false;
    document.body.classList.add("is-locked");
    window.setTimeout(function(){ if (input) input.focus(); }, 20);
  }
  function closeSearch(){
    var dialog = $("[data-search-dialog]");
    if (!dialog) return;
    dialog.hidden = true;
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function initSearch(){
    $$('[data-search-open]').forEach(function(button){ button.addEventListener("click", openSearch); });
    $$('[data-search-close]').forEach(function(button){ button.addEventListener("click", closeSearch); });
    var input = $("[data-search-input]");
    var results = $$("[data-search-results] button");
    var empty = $("[data-search-empty]");
    if (input) input.addEventListener("input", function(){
      var query = input.value.trim().toLowerCase(); var visible = 0;
      results.forEach(function(result){ var show = !query || result.dataset.searchText.indexOf(query) !== -1; result.hidden = !show; if (show) visible++; });
      empty.hidden = visible !== 0;
    });
    results.forEach(function(result){ result.addEventListener("click", function(){ closeSearch(); var target = document.getElementById(result.dataset.result); if (target) target.scrollIntoView({behavior:"smooth", block:"start"}); else { var card = $("[data-title*='" + result.dataset.result + "']"); if (card) card.scrollIntoView({behavior:"smooth"}); } }); });
    document.addEventListener("keydown", function(event){ if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); } if (event.key === "Escape" && !$("[data-search-dialog]").hidden) closeSearch(); if (event.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { event.preventDefault(); openSearch(); } });
  }
  function initCompletion(){
    var buttons = $$('[data-complete]');
    buttons.forEach(function(button){
      var key = "pragyaroot-complete-" + button.dataset.complete;
      var note = $("[data-completion-note]");
      var restore = function(){ var done = false; try { done = localStorage.getItem(key) === "1"; } catch (e) {} if (done) { button.innerHTML = "Understood <span>✓</span>"; if (note) note.textContent = "Saved to your learning pulse."; } };
      restore();
      button.addEventListener("click", function(){ try { localStorage.setItem(key, "1"); } catch (e) {} button.innerHTML = "Understood <span>✓</span>"; if (note) note.textContent = "Saved to your learning pulse."; showToast("Added to your learning pulse"); });
    });
    $$('[data-start-session]').forEach(function(link){ link.addEventListener("click", function(){ showToast("Your 10-minute session starts with one clear idea."); }); });
    $$('[data-focus]').forEach(function(button){ button.addEventListener("click", function(){ var card = $(".lesson-card"); if (card) { card.classList.toggle("focus-mode"); document.body.classList.toggle("is-locked", card.classList.contains("focus-mode")); button.innerHTML = card.classList.contains("focus-mode") ? "Exit focus mode <span>×</span>" : "Enter focus mode <span>↗</span>"; if (card.classList.contains("focus-mode")) card.scrollIntoView({behavior:"smooth", block:"center"}); } }); });
  }
  function showToast(message){ var toast = $("[data-toast]"); if (!toast) return; toast.textContent = message; toast.hidden = false; window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(function(){ toast.hidden = true; }, 3200); }
  function initReveal(){
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) { items.forEach(function(item){ item.classList.add("is-visible"); }); return; }
    var observer = new IntersectionObserver(function(entries){ entries.forEach(function(entry){ if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }); }, {threshold:.12});
    items.forEach(function(item){ observer.observe(item); });
  }
  function init(){
    initTheme(); initHeader(); initTabs(); initSearch(); initCompletion(); initReveal();
    $$('[data-year]').forEach(function(node){ node.textContent = new Date().getFullYear(); });
    if ("serviceWorker" in navigator) window.addEventListener("load", function(){ navigator.serviceWorker.register("./sw.js").catch(function(){}); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
