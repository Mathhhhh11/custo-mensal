// Custo Mensal — guarda o app no celular para abrir mesmo sem internet.
// Ao publicar uma versão nova, aumente o número abaixo.
const VERSAO = "cm-v2";
const ARQUIVOS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("script.google.com") || url.hostname.endsWith("googleusercontent.com")) return; // planilha: sempre online
  if (url.origin === location.origin) {
    // app: tenta a rede primeiro (pega atualizações), cai para o cache sem internet
    e.respondWith(fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(r => { const copy = r.clone(); caches.open(VERSAO).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
  } else if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copy = res.clone(); caches.open(VERSAO).then(c => c.put(req, copy)); return res; })));
  }
});
