"use strict";

(() => {
  const status = document.createElement("aside");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.style.cssText = [
    "position:fixed",
    "z-index:9999",
    "right:12px",
    "bottom:12px",
    "display:flex",
    "align-items:center",
    "gap:10px",
    "max-width:calc(100vw - 24px)",
    "padding:10px 14px",
    "border:1px solid rgba(140,200,255,.32)",
    "border-radius:12px",
    "color:#f5f6fa",
    "background:rgba(11,16,28,.96)",
    "box-shadow:0 8px 28px rgba(0,0,0,.3)",
    "font:600 13px/1.4 system-ui,sans-serif"
  ].join(";");

  const message = document.createElement("span");
  status.append(message);
  document.body.append(status);

  function updateConnectionMessage() {
    message.textContent = navigator.onLine
      ? "Con internet. Las páginas guardadas también estarán disponibles sin conexión."
      : "Sin internet: páginas y herramientas locales disponibles. Cuentas y rutinas en línea requieren conexión.";
  }

  updateConnectionMessage();
  window.addEventListener("online", updateConnectionMessage);
  window.addEventListener("offline", updateConnectionMessage);

  let installPrompt = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    const installButton = document.createElement("button");
    installButton.type = "button";
    installButton.textContent = "Instalar";
    installButton.style.cssText = "padding:7px 10px;border:1px solid #60a5fa;border-radius:8px;color:#fff;background:#123d68;font:inherit;cursor:pointer";
    installButton.addEventListener("click", async () => {
      if (!installPrompt) return;
      await installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      installButton.remove();
    });
    status.append(installButton);
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    message.textContent = "Zona de Poder instalada. Las páginas quedarán disponibles sin conexión.";
  });

  if (!("serviceWorker" in navigator)) {
    message.textContent = "Sin caché sin conexión: abre el sitio desde localhost o HTTPS con un navegador compatible.";
    return;
  }

  navigator.serviceWorker.register("./service-worker.js")
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      if (navigator.onLine) {
        message.textContent = "Páginas guardadas para usarlas sin conexión. Cuentas y rutinas en línea requieren internet.";
      }
    })
    .catch((error) => {
      console.error("No se pudo preparar el acceso sin conexión:", error);
      message.textContent = "No se pudo preparar el acceso sin conexión. Abre el sitio desde localhost o HTTPS.";
    });
})();
