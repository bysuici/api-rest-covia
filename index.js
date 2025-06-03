import express, { urlencoded, json } from 'express'
import cors from 'cors'
import { router } from './routes/routes.js'

const app = express()
const port = 3000
const corsOptions = {
    origin: 'https://coviaaa.okip.com.mx',
    credentials: true,
    optionSuccessStatus: 200
}

app.use(urlencoded({ extended: true, limit: '100mb' }))
app.use(json({ limit: '100mb' }))
app.use(cors(corsOptions))
app.use(router)

app.listen(port, () => {
    console.log(`Listen on: http://62.72.1.142:${port}`)
})
