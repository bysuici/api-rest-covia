import express, { urlencoded, json } from 'express'
import cors from 'cors'
import { router_ephemeral } from './routes/ephemeral.js'
import { router } from './routes/routes.js'


const app = express()
const port = process.env.PORT || 3000

const corsOptions = {
  origin: process.env.CORS_WEB || process.env.CORS_API,
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(urlencoded({ extended: true, limit: '100mb' }))
app.use(json({ limit: '100mb' }))
app.use(cors(corsOptions))

app.use('/api/docs', router_ephemeral)
app.use(router)

app.listen(port, () => {
  console.log(`Listen on: http://62.72.1.142:${port}`)
})
