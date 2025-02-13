import { Router } from 'express'
import { report } from '../controller/controller.js'
import multer from 'multer'

export const router = Router()
const upload = multer();

router.post('/report', report)
router.post('/alarm', upload.none(), (request, response) => {
    console.log("🚨 Alerta recibida:", request.body); // Ahora debería mostrar los datos correctamente

    response.status(200).json({ msg: 'alert_received' });
});