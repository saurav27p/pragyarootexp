(function(){
  "use strict";

  document.body.classList.add("pr-loading");

  const currentScript = document.currentScript;
  const componentsBase = (currentScript && currentScript.getAttribute("data-components-base")) || "./components/";

  const componentMap = {
    "header": "header.html",
    "sidebar": "sidebar.html",
    "drawer": "drawer.html",
    "search": "search.html",
    "footer": "footer.html",
    "back-to-top": "back-to-top.html"
  };

  function fetchComponent(name){
    const file = componentMap[name];
    if(!file) return Promise.resolve("");
    return fetch(componentsBase + file, {cache:"no-cache"})
      .then(function(res){
        if(!res.ok) throw new Error("Failed to load " + file);
        return res.text();
      })
      .catch(function(){ return ""; });
  }

  function replacePlaceholder(el, html){
    if(!html) return;
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const fragment = document.createDocumentFragment();
    while(temp.firstChild){
      fragment.appendChild(temp.firstChild);
    }
    el.parentNode.replaceChild(fragment, el);
  }

  function loadComponents(){
    const placeholders = document.querySelectorAll("[data-component]");
    const tasks = [];

    placeholders.forEach(function(el){
      const name = el.getAttribute("data-component");
      tasks.push(
        fetchComponent(name).then(function(html){
          replacePlaceholder(el, html);
        })
      );
    });

    return Promise.all(tasks);
  }

  function setActiveLink(){
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf("/") + 1) || "index.html";

    document.querySelectorAll(".pr-sidebar-link, .pr-drawer-link").forEach(function(link){
      const href = link.getAttribute("href") || "";
      const linkFile = href.substring(href.lastIndexOf("/") + 1);

      if(linkFile && linkFile === file){
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }else{
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    });
  }

  function initTheme(){
    const themeBtn = document.getElementById("themeBtn");
    const themeIcon = document.getElementById("themeIcon");

    function safeGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
    function safeSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}

    function applyTheme(theme){
      const dark = theme === "dark";
      document.documentElement.classList.toggle("dark", dark);

      if(themeBtn) themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");

      if(themeIcon){
        themeIcon.innerHTML = dark
          ? '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z"></path>'
          : '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.42 1.42"></path><path d="M17.65 17.65l1.42 1.42"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M4.93 19.07l1.42-1.42"></path><path d="M17.65 6.35l1.42-1.42"></path>';
      }
    }

    const saved = safeGet("pragyaroot-theme");
    if(saved){
      applyTheme(saved);
    }else{
      applyTheme(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }

    if(themeBtn){
      themeBtn.addEventListener("click", function(){
        const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
        safeSet("pragyaroot-theme", next);
        applyTheme(next);
      });
    }
  }

  function initHeaderScroll(){
    const header = document.getElementById("prHeader");
    if(!header) return;

    function update(){
      if(window.scrollY > 8){
        header.classList.add("scrolled");
      }else{
        header.classList.remove("scrolled");
      }
    }

    window.addEventListener("scroll", update, {passive:true});
    update();
  }

  function initDrawer(){
    const menuBtn = document.getElementById("menuBtn");
    const drawer = document.getElementById("mobileDrawer");
    const overlay = document.getElementById("overlay");
    const drawerClose = document.getElementById("drawerClose");
    const mainEl = document.querySelector(".pr-main");
    const footerEl = document.querySelector(".pr-footer");
    let lastFocused = null;

    if(!drawer) return;

    function openDrawer(){
      lastFocused = document.activeElement;
      drawer.classList.add("open");
      if(overlay) overlay.classList.add("open");
      drawer.setAttribute("aria-hidden","false");
      document.body.style.overflow = "hidden";
      if(menuBtn) menuBtn.setAttribute("aria-expanded","true");
      if(mainEl) mainEl.setAttribute("inert","");
      if(footerEl) footerEl.setAttribute("inert","");
      const firstLink = drawer.querySelector("a, button");
      if(firstLink) setTimeout(function(){firstLink.focus()}, 60);
    }

    function closeDrawer(){
      drawer.classList.remove("open");
      if(overlay) overlay.classList.remove("open");
      drawer.setAttribute("aria-hidden","true");
      document.body.style.overflow = "";
      if(menuBtn) menuBtn.setAttribute("aria-expanded","false");
      if(mainEl) mainEl.removeAttribute("inert");
      if(footerEl) footerEl.removeAttribute("inert");
      if(lastFocused && lastFocused.focus) lastFocused.focus();
    }

    if(menuBtn) menuBtn.addEventListener("click", openDrawer);
    if(drawerClose) drawerClose.addEventListener("click", closeDrawer);
    if(overlay) overlay.addEventListener("click", closeDrawer);

    drawer.querySelectorAll("a").forEach(function(link){
      link.addEventListener("click", closeDrawer);
    });

    document.addEventListener("keydown", function(e){
      if(e.key === "Tab" && drawer.classList.contains("open")){
        const focusables = drawer.querySelectorAll('a[href], button:not([disabled])');
        if(!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if(e.shiftKey && document.activeElement === first){
          e.preventDefault();
          last.focus();
        }else if(!e.shiftKey && document.activeElement === last){
          e.preventDefault();
          first.focus();
        }
      }
    });

    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && drawer.classList.contains("open")){
        closeDrawer();
      }
    });
  }

  function initLanguageMenu(){
    const langBtn = document.getElementById("langBtn");
    const langMenu = document.getElementById("langMenu");
    if(!langBtn || !langMenu) return;

    langBtn.addEventListener("click", function(e){
      e.stopPropagation();
      const open = langMenu.classList.toggle("open");
      langBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    langMenu.querySelectorAll(".pr-lang-option").forEach(function(option){
      option.addEventListener("click", function(){
        const lang = this.dataset.lang;
        document.documentElement.lang = lang;
        langMenu.querySelectorAll(".pr-lang-option").forEach(function(o){
          o.setAttribute("aria-selected", o === option ? "true" : "false");
        });
        langMenu.classList.remove("open");
        langBtn.setAttribute("aria-expanded","false");
      });
    });

    document.addEventListener("click", function(e){
      if(!langMenu.contains(e.target) && !langBtn.contains(e.target)){
        langMenu.classList.remove("open");
        langBtn.setAttribute("aria-expanded","false");
      }
    });
  }

  function initSearch(){
    const searchBtn = document.getElementById("searchBtn");
    const searchPanel = document.getElementById("searchPanel");
    const searchClose = document.getElementById("searchClose");
    const searchInput = document.getElementById("searchInput");
    const searchMeta = document.getElementById("searchMeta");
    const searchResults = document.getElementById("searchResults");

    if(!searchBtn || !searchPanel) return;

    let searchIndex = [];
    let searchBuilt = false;
    let searchTimer = null;

    function getSearchableText(el){
      let text = el.innerText || el.textContent || "";
      el.querySelectorAll("[alt],[title],[aria-label]").forEach(function(node){
        text += " " +
          (node.getAttribute("alt") || "") + " " +
          (node.getAttribute("title") || "") + " " +
          (node.getAttribute("aria-label") || "");
      });
      return text.replace(/\s+/g," ").trim();
    }

    function buildSearchIndex(){
      searchIndex = [];
      const seen = new Set();

      const blocks = document.querySelectorAll(
        ".pr-main section, .pr-main .trust-card, .pr-main .subj-real, .pr-main .subj-dummy, .pr-main .grammar-item, .pr-main .games-real, .pr-main .tools-item, .pr-main .contact, .pr-main .hero, .pr-footer-about, .pr-footer-top > div"
      );

      blocks.forEach(function(el){
        if(seen.has(el)) return;
        seen.add(el);

        const text = getSearchableText(el);
        if(!text || text.length < 3) return;

        const heading = el.querySelector("h1, h2, h3, h4, .sname, .trust-lbl, .games-real span:first-child");
        const title = heading
          ? heading.textContent.replace(/\s+/g," ").trim()
          : (el.textContent || "").replace(/\s+/g," ").trim().slice(0,60);

        const sectionLabel = el.closest("section")?.querySelector(".sh h2")?.textContent?.trim() || "";

        searchIndex.push({
          el: el,
          text: text,
          title: title || "Section",
          section: sectionLabel,
          lowerText: text.toLowerCase(),
          lowerTitle: (title || "").toLowerCase(),
          lowerSection: (sectionLabel || "").toLowerCase()
        });
      });

      searchBuilt = true;
    }

    function makeExcerpt(text, query){
      const max = 160;
      const lowerText = text.toLowerCase();
      const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

      let index = lowerText.indexOf(query.trim().toLowerCase());

      if(index === -1 && tokens.length){
        index = lowerText.indexOf(tokens[0]);
      }

      if(index === -1){
        return text.slice(0, max) + (text.length > max ? "…" : "");
      }

      let start = Math.max(0, index - 65);
      let end = Math.min(text.length, start + max);

      if(start > 0){
        const sp = text.indexOf(" ", start);
        if(sp !== -1) start = sp;
      }

      let excerpt = text.slice(start, end).trim();
      if(start > 0) excerpt = "…" + excerpt;
      if(end < text.length) excerpt += "…";
      return excerpt;
    }

    function searchSite(query){
      const cleanQuery = query.trim().toLowerCase();
      searchResults.innerHTML = "";

      if(!cleanQuery){
        searchMeta.textContent = "Start typing to search";
        return;
      }

      if(!searchIndex.length){
        searchMeta.textContent = "Nothing to search";
        return;
      }

      const tokens = cleanQuery.split(/\s+/).filter(Boolean);

      const scored = searchIndex.map(function(item){
        let score = 0;
        let allTokensMatch = true;

        tokens.forEach(function(token){
          const inTitle = item.lowerTitle.includes(token);
          const inSection = item.lowerSection.includes(token);
          const inBody = item.lowerText.includes(token);

          if(inTitle) score += 12;
          if(inSection) score += 6;
          if(inBody) score += 2;

          if(!inTitle && !inSection && !inBody){
            allTokensMatch = false;
          }
        });

        if(!allTokensMatch) return null;

        if(item.lowerText.includes(cleanQuery)) score += 8;
        if(item.lowerTitle.includes(cleanQuery)) score += 20;

        return {item: item, score: score};
      }).filter(Boolean);

      scored.sort(function(a, b){ return b.score - a.score; });

      const matches = scored.map(function(s){ return s.item; });

      searchMeta.textContent = matches.length + (matches.length === 1 ? " result" : " results");

      if(!matches.length){
        searchResults.innerHTML = '<div class="pr-search-empty">No matching content found. Try fewer words.</div>';
        return;
      }

      matches.forEach(function(item){
        const result = document.createElement("button");
        result.type = "button";
        result.className = "pr-search-result";

        const title = document.createElement("div");
        title.className = "pr-search-result-title";
        title.textContent = item.section ? item.section + " · " + item.title : item.title;

        const excerpt = document.createElement("div");
        excerpt.className = "pr-search-result-excerpt";
        excerpt.textContent = makeExcerpt(item.text, cleanQuery);

        result.appendChild(title);
        result.appendChild(excerpt);

        result.addEventListener("click", function(){
          closeSearch();
          const target = item.el;
          const y = target.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({top: y, behavior: "smooth"});
          setTimeout(function(){
            target.classList.add("pr-search-highlight");
            setTimeout(function(){
              target.classList.remove("pr-search-highlight");
            }, 1400);
          }, 400);
        });

        searchResults.appendChild(result);
      });
    }

    function openSearch(){
      if(!searchBuilt) buildSearchIndex();
      searchPanel.classList.add("open");
      searchBtn.setAttribute("aria-expanded","true");
      setTimeout(function(){ if(searchInput) searchInput.focus(); }, 80);
    }

    function closeSearch(){
      searchPanel.classList.remove("open");
      searchBtn.setAttribute("aria-expanded","false");
      if(searchInput) searchInput.value = "";
      if(searchResults) searchResults.innerHTML = "";
      if(searchMeta) searchMeta.textContent = "Start typing to search";
    }

    searchBtn.addEventListener("click", function(e){
      e.stopPropagation();
      if(searchPanel.classList.contains("open")){
        closeSearch();
      }else{
        openSearch();
      }
    });

    if(searchClose) searchClose.addEventListener("click", closeSearch);

    if(searchInput){
      searchInput.addEventListener("input", function(){
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function(){
          searchSite(searchInput.value);
        }, 40);
      });
    }

    document.addEventListener("click", function(e){
      if(searchPanel.classList.contains("open") && !searchPanel.contains(e.target) && !searchBtn.contains(e.target)){
        closeSearch();
      }
    });

    document.addEventListener("keydown", function(e){
      if(e.key === "Escape"){
        closeSearch();
      }
    });
  }

  function initBackTop(){
    const backTop = document.getElementById("backTop");
    if(!backTop) return;

    function update(){
      if(window.scrollY > 420){
        backTop.classList.add("visible");
      }else{
        backTop.classList.remove("visible");
      }
    }

    window.addEventListener("scroll", update, {passive:true});
    backTop.addEventListener("click", function(){
      window.scrollTo({top:0, behavior:"smooth"});
    });
    update();
  }

  function initReveal(){
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if("IntersectionObserver" in window && !prefersReduced){
      const observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            entry.target.classList.add("on");
            observer.unobserve(entry.target);
          }
        });
      }, {threshold:0.1});

      document.querySelectorAll(".reveal").forEach(function(el){
        observer.observe(el);
      });
    }else{
      document.querySelectorAll(".reveal").forEach(function(el){
        el.classList.add("on");
      });
    }
  }

  function initRotator(){
    const rotator = document.getElementById("rw");
    if(!rotator) return;

    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(prefersReduced) return;

    const rawWords = rotator.getAttribute("data-words");
    const words = rawWords
      ? rawWords.split("|").map(function(w){ return w.trim(); }).filter(Boolean)
      : ["CLASS 10 NOTES","EXERCISE SOLUTIONS","GRAMMAR GUIDES","LEARNING GAMES","SEE PREP TOOLS"];

    let wordIndex = 0;
    let timer = null;

    function tick(){
      const next = (wordIndex + 1) % words.length;
      rotator.classList.remove("active");
      rotator.classList.add("exit");
      setTimeout(function(){
        rotator.textContent = words[next];
        rotator.classList.remove("exit");
        rotator.classList.add("active");
      }, 500);
      wordIndex = next;
    }

    function start(){
      if(timer) return;
      timer = setInterval(tick, 3000);
    }

    function stop(){
      if(timer){
        clearInterval(timer);
        timer = null;
      }
    }

    start();

    document.addEventListener("visibilitychange", function(){
      if(document.hidden){
        stop();
      }else{
        start();
      }
    });
  }

  function initContactForm(){
    const form = document.getElementById("cf");
    const fm = document.getElementById("fm");
    const sb = document.getElementById("sb");
    if(!form) return;

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function showErr(message){
      if(!fm) return;
      fm.textContent = message;
      fm.className = "fmsg er";
      setTimeout(function(){
        fm.className = "fmsg";
        fm.textContent = "";
      }, 3500);
    }

    form.addEventListener("submit", async function(e){
      e.preventDefault();

      const name = form.querySelector('[name="name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const msg = form.querySelector('[name="message"]').value.trim();

      if(!name || !email || !msg){
        showErr("Please fill in all fields.");
        return;
      }

      if(!emailRe.test(email)){
        showErr("Enter a valid email address.");
        return;
      }

      const original = sb ? sb.innerHTML : "";
      if(sb){
        sb.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending...';
        sb.disabled = true;
      }

      try{
        const res = await fetch(form.action, {
          method:"POST",
          body:new FormData(form),
          headers:{"Accept":"application/json"}
        });

        if(res.ok){
          if(fm){
            fm.textContent = "Message sent. We will get back soon.";
            fm.className = "fmsg ok";
          }
          form.reset();
        }else{
          throw new Error();
        }
      }catch(error){
        if(fm){
          fm.textContent = "Unable to send. Please try again.";
          fm.className = "fmsg er";
        }
      }finally{
        if(sb){
          sb.innerHTML = original;
          sb.disabled = false;
        }
        setTimeout(function(){
          if(fm){
            fm.className = "fmsg";
            fm.textContent = "";
          }
        }, 5000);
      }
    });

    window.addEventListener("pageshow", function(e){
      if(e.persisted) form.reset();
    });
  }

  function suppressLogoContextMenu(){
    document.querySelectorAll(".pr-header-logo, .pr-drawer-logo, .pr-footer-logo").forEach(function(logo){
      logo.addEventListener("contextmenu", function(e){
        e.preventDefault();
      });
    });
  }

  function init(){
    loadComponents().then(function(){
      setActiveLink();
      initTheme();
      initHeaderScroll();
      initDrawer();
      initLanguageMenu();
      initSearch();
      initBackTop();
      initReveal();
      initRotator();
      initContactForm();
      suppressLogoContextMenu();

      document.body.classList.remove("pr-loading");
    }).catch(function(){
      document.body.classList.remove("pr-loading");
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }

})();
