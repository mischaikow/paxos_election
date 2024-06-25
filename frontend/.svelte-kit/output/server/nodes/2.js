

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.vCJVgafT.js","_app/immutable/chunks/scheduler.zMJaRgub.js","_app/immutable/chunks/index.LfI3cGzv.js"];
export const stylesheets = ["_app/immutable/assets/2.cGz4eUpp.css"];
export const fonts = [];
