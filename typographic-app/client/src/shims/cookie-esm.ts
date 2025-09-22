// ESM wrapper for the CJS `cookie` package to expose named exports
// Keep implementation minimal and resilient when `cookie` is a function or object.
let cookiePkg: any;
try {
	// prefer static import when possible
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	cookiePkg = require('cookie');
} catch (e) {
	cookiePkg = (globalThis as any).cookie || {};
}

const defaultExport = cookiePkg && cookiePkg.__esModule ? cookiePkg.default : cookiePkg;

export const parse = (defaultExport && defaultExport.parse) || ((str: string) => {
	try {
		// if cookie is a function, call it; otherwise return empty object
		return typeof defaultExport === 'function' ? defaultExport(str) : {};
	} catch (e) {
		return {};
	}
});

export const serialize = (defaultExport && defaultExport.serialize) || ((name: string, val: string) => `${name}=${val}`);

export default defaultExport || {};
