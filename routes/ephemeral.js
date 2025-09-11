import { Router } from "express";
import * as DocsController from '../controller/ephemeral.js'

export const router_ephemeral = Router()

router_ephemeral.post('/export/pdf', DocsController.exportPdf)
router_ephemeral.get('/ephemeral/:token', DocsController.downloadEphemeral)