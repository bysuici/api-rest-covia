import { Router } from 'express'
import {  report, reportGeneral, reportRadio , reportMision } from '../controller/controller.js'

export const router = Router()

router.post('/report', report)
router.post('/report-general', reportGeneral)
router.post('/report-radio', reportRadio)
router.post('/report-mision', reportMision)
