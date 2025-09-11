export function sanitizeName(s, def = 'reporte') {
return (String(s || def).trim().replace(/[^a-zA-Z0-9_\-.]+/g, '_').replace(/^_+|_+$/g, '')) || def
}
export function withExt(name, ext) {
ext = ext.startsWith('.') ? ext : `.${ext}`
return name.toLowerCase().endsWith(ext) ? name : `${name}${ext}`
}