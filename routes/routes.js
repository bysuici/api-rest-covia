import { Router } from 'express'
import { report } from '../controller/controller.js'

export const router = Router()

router.post('/report', report)
router.post('/alarm', (request, response) => {
    console.log("🚨 Alerta recibida:", request);
    response.status(200).json({ msg: 'alert_received' })
})