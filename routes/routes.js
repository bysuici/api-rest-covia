import { Router } from 'express'
import { report } from '../controller/controller.js'

export const router = Router()

router.post('/report', report)