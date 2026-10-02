import { CLARITY_ID, CONSENT_KEY, CONSENT_MODE, GA_ID, OPTOUT_KEY, PROD_HOST } from './analytics';

/**
 * Arma el único script inline que carga la analítica. Hace todo en orden
 * —guarda por dominio, opt-out personal, consentimiento por defecto, config de
 * GA4 y carga de gtag.js y Clarity— para que el consentimiento quede aplicado
 * antes que cualquier `config`, y una sola vez, con el valor ya guardado.
 *
 * Devuelve '' si no hay dominio o no hay ningún ID: entonces no se inserta nada.
 *
 * Herramientas para quien administra el sitio:
 *  - `?no_track=1` en tus dispositivos: deja de medirte (y `?no_track=0` lo revierte).
 *  - `?debug_analytics=1`: manda los eventos al DebugView de GA4 en esa pestaña.
 */
export function buildAnalyticsInitScript(): string {
  if (!PROD_HOST || !(GA_ID || CLARITY_ID)) return '';

  const v = (x: string) => JSON.stringify(x);

  return `(function () {
  var GA_ID = ${v(GA_ID)};
  var CLARITY_ID = ${v(CLARITY_ID)};
  var PROD_HOST = ${v(PROD_HOST)};
  var CONSENT_MODE = ${v(CONSENT_MODE)};

  var host = location.hostname.replace(/^www\\./, "");
  if (host !== PROD_HOST) return;

  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  var qs = new URLSearchParams(location.search);
  if (qs.get("no_track") === "1") ls.set(${v(OPTOUT_KEY)}, "1");
  if (qs.get("no_track") === "0") ls.del(${v(OPTOUT_KEY)});
  if (ls.get(${v(OPTOUT_KEY)}) === "1") return;

  var stored = ls.get(${v(CONSENT_KEY)});
  var granted = stored === "granted" || (stored === null && CONSENT_MODE === "notice");

  try { if (qs.get("debug_analytics") === "1") sessionStorage.setItem("debug_analytics", "1"); } catch (e) {}
  var debug = false;
  try { debug = sessionStorage.getItem("debug_analytics") === "1"; } catch (e) {}

  if (GA_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: granted ? "granted" : "denied"
    });
    window.gtag("js", new Date());
    // debug_mode:false también activa el debug: la clave se omite.
    window.gtag("config", GA_ID, debug ? { debug_mode: true } : {});
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(g);
  }

  if (CLARITY_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
    // Claves con S mayúscula: en minúscula Clarity las ignora.
    window.clarity("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: granted ? "granted" : "denied"
    });
  }
})();`;
}
