// The CRM app lives at /crm/ (with its own service worker).
// This file only removes an app service worker that was briefly registered
// at the site root by mistake. It does nothing else and can be deleted later.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.registration.unregister());
});
