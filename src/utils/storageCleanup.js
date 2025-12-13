// src/utils/storageCleanup.js

export const cleanupGrapesJSStorage = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('gjs-')) {
      localStorage.removeItem(key);
      console.log(`Removed: ${key}`);
    }
  });
};

export const removeDuplicateTemplates = () => {
  const templates = [];
  const seenContent = new Map();
  
  // Collect all templates
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("template_")) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        const contentHash = `${data.name}-${(data.html || '').substring(0, 100)}`;
        
        if (!seenContent.has(contentHash)) {
          seenContent.set(contentHash, key);
          templates.push({ key, data });
        } else {
          // Remove duplicate
          localStorage.removeItem(key);
          console.log(`Removed duplicate: ${key}`);
        }
      } catch (e) {
        console.error(`Error processing ${key}`, e);
      }
    }
  }
  
  return templates.length;
};