// Minimal preload for Electron; keeps contextIsolation enabled and exposes no privileged APIs yet.
const { contextBridge } = require('electron');

// Expose an empty namespace for future safe APIs
contextBridge.exposeInMainWorld('electronAPI', {});
