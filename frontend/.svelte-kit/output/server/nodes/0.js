

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.Tucy_uH9.js","_app/immutable/chunks/scheduler.zMJaRgub.js","_app/immutable/chunks/index.LfI3cGzv.js"];
export const stylesheets = [];
export const fonts = [];
