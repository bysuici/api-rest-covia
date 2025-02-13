import { Router } from 'express'
import express from 'express'
import { report } from '../controller/controller.js'

export const router = Router()

// Middleware para capturar `multipart/form-data` como `Buffer`
router.use('/alarm', express.raw({ type: "multipart/form-data", limit: "1mb" }));

router.post('/report', report)

router.post('/alarm', (request, response) => {
    const bodyText = request.body.toString(); // Convertir buffer a string

    console.log("🚨 Alerta recibida (cruda):", bodyText);

    // Intentamos extraer los datos de la alerta
    const parsedData = parseHikvisionData(bodyText);
    console.log("🚨 Alerta procesada:", parsedData);

    response.status(200).json({ msg: 'alert_received', data: parsedData });
});

// Función para extraer datos del formato de Hikvision
function parseHikvisionData(bodyText) {
    const data = {};
    const lines = bodyText.split("\r\n"); // Dividir por saltos de línea

    lines.forEach((line) => {
        if (line.includes("=")) {
            const [key, value] = line.split("=");
            data[key.trim()] = value.trim();
        }
    });

    return data;
}
