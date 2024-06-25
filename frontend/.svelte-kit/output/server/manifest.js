export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {"start":"_app/immutable/entry/start.9DDF26GN.js","app":"_app/immutable/entry/app.DFq7yndT.js","imports":["_app/immutable/entry/start.9DDF26GN.js","_app/immutable/chunks/entry.YSDnPgDJ.js","_app/immutable/chunks/scheduler.zMJaRgub.js","_app/immutable/entry/app.DFq7yndT.js","_app/immutable/chunks/scheduler.zMJaRgub.js","_app/immutable/chunks/index.LfI3cGzv.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
