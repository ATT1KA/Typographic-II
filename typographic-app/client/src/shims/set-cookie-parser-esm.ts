// ESM wrapper for the CJS `set-cookie-parser` package
let scp: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  scp = require('set-cookie-parser');
} catch (e) {
  scp = (globalThis as any)['setCookieParser'] || {};
}

const defaultExport = scp && scp.__esModule ? scp.default : scp;

export const splitCookiesString = (scp && scp.splitCookiesString) || ((header: string | string[] | null) => {
  if (!header) return [];
  if (Array.isArray(header)) return header;
  return String(header).split(/\r?\n/).filter(Boolean);
});

export const parse = (scp && scp.parse) || ((header: any, options?: any) => {
  try {
    if (scp && typeof scp.parse === 'function') return scp.parse(header, options);
    return {};
  } catch (e) {
    return {};
  }
});

export default defaultExport || {};
