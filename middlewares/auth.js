import jwt from 'jsonwebtoken'


export function requireAuth(req, res, next) {
try {
const raw = req.headers.authorization || ''
if (!raw) return res.status(401).json({ ok: false, message: 'No autorizado: falta Authorization' })


const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw
const claims = jwt.verify(token, process.env.SECRET_KEY)
if (!claims?.id) return res.status(401).json({ ok: false, message: 'Token inválido: falta id' })


req.user = { id: claims.id, claims }
next()
} catch (e) {
const msg = e?.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido'
return res.status(401).json({ ok: false, message: msg })
}
}