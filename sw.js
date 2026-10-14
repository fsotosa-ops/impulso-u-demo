// Guarda la demo en el celular para que el simulacro abra y se responda sin conexión.
const CACHE = 'impulsou-v10';
const ARCHIVOS = [
  './', 'index.html', 'css/estilo.css', 'data/banco.json', 'manifest.webmanifest',
  'js/app.js', 'js/estado.js', 'js/ui.js', 'js/hoy.js', 'js/banco.js',
  'js/simulacros.js', 'js/grupo.js', 'js/hojas.js', 'js/simulacro.js',
  'js/crear.js', 'js/generador.js', 'js/login.js', 'js/importar.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Red primero, para que una versión nueva se vea apenas hay señal; sin red, lo guardado.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
