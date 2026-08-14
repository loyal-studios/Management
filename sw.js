const CACHE_NAME='lsm-shell-v1.2.2';
const SHELL=[
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './assets/logo-dark.png',
  './assets/logo-light.png',
  './assets/favicon.png',
  './assets/app-icon.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);

  // Private Apps Script content/data remains network-only.
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)).catch(()=>{});
        return response;
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }

  if(url.pathname.endsWith('/config.js')){
    event.respondWith(
      fetch(request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});
        return response;
      }).catch(()=>caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>{
      const network=fetch(request).then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});
        }
        return response;
      }).catch(()=>cached);
      return cached||network;
    })
  );
});
