import { Router } from 'express'
import { report } from '../controller/controller.js'

export const router = Router()

router.get('/test', (req, res) => {
    res.json({
        message: 'Alright its okay'
    })
})
router.post('/report', report)