import express, { urlencoded, json } from 'express'
import cors from 'cors'
import { router } from './routes/routes.js'

const app = express()
const port = 3000

// Configuracion del servicio
app.use(urlencoded({ extended: true }))
app.use(json())
app.use(cors())

// Routers
app.use(router)

// Configurar puerto
app.listen(port, () => {
    console.log(`Listen on port 3000`)
})