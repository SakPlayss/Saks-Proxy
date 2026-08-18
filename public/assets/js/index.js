"use strict";

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("sj-form");
  const address = document.getElementById("sj-address");
  const searchEngine = document.getElementById("sj-search-engine");

  const browser = document.getElementById("browser-shell");
  const home = document.getElementById("home-view");

  const tabs = document.getElementById("tabs");
  const frameArea = document.getElementById("frame-area");

  const urlBar = document.getElementById("browser-url");

  const back = document.getElementById("back-btn");
  const forward = document.getElementById("forward-btn");
  const reload = document.getElementById("reload-btn");
  const newTab = document.getElementById("new-tab-btn");

  const msg = document.getElementById("msg");

  const messages = [
    "Welcome to my site!",
    "workin on it lol",
    "tacos",
    "Imagine being in school💀",
    "Reimaging the future of ubg sites. - Sakplays",
    "new update everyday",
    "Powered by the North Korean spy truck😭💀🥀",
  ];

  const blockedRedirects = [
    "goguardian.com",
    "blocked",
    "block",
    "blocked.goguardian.com",
    "securly",
    "lightspeedsystems"
  ];

  if (msg) {
    msg.textContent = messages[Math.floor(Math.random() * messages.length)];
  }

  const { ScramjetController } = $scramjetLoadController();

  const scramjet = new ScramjetController({
    files: {
      wasm: "/scram/scramjet.wasm.wasm",
      all: "/scram/scramjet.all.js",
      sync: "/scram/scramjet.sync.js"
    }
  });

  scramjet.init();

  const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

  let activeFrame = null;

  function normalize(q) {
    q = (q || "").trim();
    if (!q) return "";

    if (!/^https?:\/\//i.test(q)) {
      if (q.includes(".") && !q.includes(" ")) {
        q = "https://" + q;
      } else {
        q = "https://duckduckgo.com/?q=" + encodeURIComponent(q);
      }
    }

    return q;
  }

  function activateTab(tab, frame) {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
    });

    document.querySelectorAll(".browser-frame").forEach((f) => {
      f.style.display = "none";
    });

    tab.classList.add("active");
    frame.style.display = "block";

    activeFrame = frame;
    urlBar.value = frame.dataset.url || "";
  }

  async function openInFrame(frame, url) {
    const final = normalize(url);
async function openInFrame(frame, url) {
  const final = normalize(url);

  if (!final) return;

  const blocked =
    blockedRedirects.some((bad) =>
      final.toLowerCase().includes(
        bad.toLowerCase()
      )
    );

  if (blocked) {

    console.log(
      "Blocked redirect:",
      final
    );

    return;
  }

  browser.style.display = "flex";
  home.style.display = "none";

  frame.dataset.url = final;
  urlBar.value = final;

  try {

    await registerSW();

    const wispUrl =
      (location.protocol === "https:" ? "wss" : "ws") +
      "://" +
      location.host +
      "/wisp/";

    if (
      (await connection.getTransport()) !==
      "/libcurl/index.mjs"
    ) {

      await connection.setTransport(
        "/libcurl/index.mjs",
        [
          {
            websocket: wispUrl
          }
        ]
      );

    }

    await frame.scramjetFrame.go(final);

  } catch (e) {

    console.error(e);

  }
}
    if (!final) return;

    browser.style.display = "flex";
    home.style.display = "none";

    frame.dataset.url = final;
    urlBar.value = final;

    try {
      await registerSW();

      const wispUrl =
        (location.protocol === "https:" ? "wss" : "ws") +
        "://" +
        location.host +
        "/wisp/";

      if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [
          { websocket: wispUrl }
        ]);
      }

      await frame.scramjetFrame.go(final);
    } catch (e) {
      console.error(e);
    }
  }

window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  e.returnValue = "";
});

  function createTab(url) {
    const tab = document.createElement("div");
    tab.className = "tab";

    const favicon = document.createElement("img");
    favicon.className = "tab-favicon";
    favicon.src = "/favicon.ico";

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = "New Tab";

    const close = document.createElement("button");
    close.className = "tab-close";
    close.textContent = "×";

    tab.appendChild(favicon);
    tab.appendChild(title);
    tab.appendChild(close);

    tabs.appendChild(tab);

    const sjFrame = scramjet.createFrame();
    sjFrame.frame.className = "browser-frame";
    sjFrame.frame.style.display = "none";

    frameArea.appendChild(sjFrame.frame);

    const frame = sjFrame.frame;
    frame.scramjetFrame = sjFrame;

    close.addEventListener("click", (e) => {
      e.stopPropagation();

      const allTabs = [...document.querySelectorAll(".tab")];
      const index = allTabs.indexOf(tab);

      tab.remove();
      frame.remove();

      if (activeFrame === frame) {
        const remainingTabs = [...document.querySelectorAll(".tab")];
        const remainingFrames = [...document.querySelectorAll(".browser-frame")];

        if (!remainingFrames.length) {
          activeFrame = null;
          browser.style.display = "none";
          home.style.display = "block";
          urlBar.value = "";
          return;
        }

        const nextIndex = Math.max(0, index - 1);
        activateTab(remainingTabs[nextIndex], remainingFrames[nextIndex]);
      }
    });

    tab.addEventListener("click", () => {
      activateTab(tab, frame);
    });

    activateTab(tab, frame);

    if (url) {
      openInFrame(frame, url);
    }
  }

  async function open(url) {
    if (!activeFrame) {
      createTab(url);
    } else {
      await openInFrame(activeFrame, url);
    }
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const value = address.value.trim();
    if (!value) return;

    const url = typeof search === "function"
      ? search(value, searchEngine?.value || "https://duckduckgo.com/?q=%s")
      : normalize(value);

    await open(url);
  });

  urlBar?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const value = urlBar.value.trim();
      if (!value) return;

      await open(value);
    }
  });

  newTab?.addEventListener("click", () => {
    createTab("https://duckduckgo.com");
  });

  back?.addEventListener("click", () => {
    activeFrame?.contentWindow?.history.back();
  });

  forward?.addEventListener("click", () => {
    activeFrame?.contentWindow?.history.forward();
  });

  reload?.addEventListener("click", () => {
    activeFrame?.contentWindow?.location.reload();
  });
});