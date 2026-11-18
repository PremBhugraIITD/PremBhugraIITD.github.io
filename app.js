(function () {
  var nav = document.querySelector("[data-nav]");
  var menu = nav.querySelector(".menu");
  var links = nav.querySelector(".links");

  menu.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    menu.setAttribute("aria-expanded", open ? "true" : "false");
  });

  links.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      links.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    }
  });

  var tabShield = document.getElementById("tab-shield");
  var tabSense = document.getElementById("tab-sense");
  var panelShield = document.getElementById("panel-shield");
  var panelSense = document.getElementById("panel-sense");

  function selectTab(which) {
    var shield = which === "shield";
    tabShield.setAttribute("aria-selected", shield ? "true" : "false");
    tabSense.setAttribute("aria-selected", shield ? "false" : "true");
    tabShield.tabIndex = shield ? 0 : -1;
    tabSense.tabIndex = shield ? -1 : 0;
    panelShield.hidden = !shield;
    panelSense.hidden = shield;
    (shield ? tabShield : tabSense).focus();
  }

  tabShield.addEventListener("click", function () { selectTab("shield"); });
  tabSense.addEventListener("click", function () { selectTab("sense"); });
  [tabShield, tabSense].forEach(function (tab) {
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      selectTab(tab === tabShield ? "sense" : "shield");
    });
  });

  var label = panelShield.querySelector("[data-state-label]");
  var note = panelShield.querySelector("[data-state-note]");
  document.querySelector("[data-toggle-cover]").addEventListener("click", function () {
    var covered = panelShield.getAttribute("data-state") !== "open";
    panelShield.setAttribute("data-state", covered ? "open" : "covered");
    label.textContent = covered ? "Cover open" : "Cover armed";
    note.textContent = covered
      ? "The preview cover is lifted. On a Mac, lifting it still requires the owner."
      : "Input is held at the session. Unlock asks for Touch ID or the Mac password.";
  });

  var meters = {
    cpu: { el: "cpu", min: 8, max: 42, suffix: "%", scale: 100 },
    gpu: { el: "gpu", min: 4, max: 36, suffix: "%", scale: 100 },
    hinge: { el: "hinge", min: 96, max: 128, suffix: "°", scale: 140 },
    force: { el: "force", min: 0, max: 240, suffix: "", scale: 400 },
    temp: { el: "temp", min: 34, max: 46, suffix: "°C", scale: 60 },
    tilt: { el: "tilt", min: 0, max: 4, suffix: "°", scale: 8, digits: 1 }
  };
  var values = {};
  Object.keys(meters).forEach(function (key) { values[key] = (meters[key].min + meters[key].max) / 2; });

  function paintMeters() {
    Object.keys(meters).forEach(function (key) {
      var spec = meters[key];
      var node = document.querySelector('[data-meter="' + spec.el + '"]');
      var bar = document.querySelector('[data-bar="' + spec.el + '"]');
      var shown = spec.digits ? values[key].toFixed(spec.digits) : String(Math.round(values[key]));
      node.textContent = shown + spec.suffix;
      bar.style.width = Math.max(8, Math.min(100, (values[key] / spec.scale) * 100)) + "%";
    });
  }

  function drift() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    Object.keys(meters).forEach(function (key) {
      var spec = meters[key];
      var step = (spec.max - spec.min) * 0.08;
      values[key] += (Math.random() - 0.48) * step;
      values[key] = Math.max(spec.min, Math.min(spec.max, values[key]));
    });
    paintMeters();
  }

  paintMeters();
  setInterval(drift, 1600);

  var copyButton = document.querySelector("[data-copy-email]");
  var copyStatus = document.querySelector("[data-copy-status]");
  copyButton.addEventListener("click", function () {
    var address = "prem@shieldcore.me";
    function done() {
      copyStatus.textContent = "Copied " + address;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(done).catch(fallback);
    } else {
      fallback();
    }
    function fallback() {
      var field = document.createElement("textarea");
      field.value = address;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
      done();
    }
  });

  var form = document.getElementById("access-form");
  var formStatus = document.querySelector("[data-form-status]");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var name = String(data.get("name") || "").trim();
    var email = String(data.get("email") || "").trim();
    var interest = String(data.get("interest") || "").trim();
    var message = String(data.get("message") || "").trim();
    if (!name || !email || !interest || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formStatus.textContent = "Add your name, a valid email, and a short note.";
      return;
    }
    var subject = "Early access — " + interest;
    var body = "Name: " + name + "\nEmail: " + email + "\nInterest: " + interest + "\n\n" + message;
    window.location.href = "mailto:prem@shieldcore.me?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    formStatus.textContent = "Your mail app should open with this request addressed to prem@shieldcore.me.";
  });
})();
