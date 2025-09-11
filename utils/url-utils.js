export function guessBaseUrl(req) {
const configured = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '')
if (configured) return configured
const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http'
const host = req.headers['x-forwarded-host'] || req.headers.host
return `${proto}://${host}`
}
export function buildEphemeralUrl(req, token) {
return `${guessBaseUrl(req)}/api/docs/ephemeral/${token}`
}