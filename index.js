import express, { urlencoded, json } from 'express'
import cors from 'cors'
import { router } from './routes/routes.js'

const app = express()
const port = 3000

// Configuracion del servicio
app.use(urlencoded({ extended: true, limit: '100mb' }))
app.use(json({ limit: '100mb' }))
app.use(cors())

// Routers
app.use(router)

// Configurar puerto
app.listen(port, () => {
    console.log(`Listen on: http://localhost:${port}`)
})