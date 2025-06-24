import { Router } from 'express'
import { report, reportGeneral } from '../controller/controller.js'

export const router = Router()

router.post('/report', report)
router.post('/report-general', reportGeneral)
