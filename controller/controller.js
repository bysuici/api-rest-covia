import { pdfGenerator, mergePDFs } from '../procedures/pdfGenerator.js'
import { validateToken } from '../procedures/validateToken.js'
import { getDevices } from '../procedures/devices.js'

export const report = async (request, response) => {
    const { authorization } = request.headers
    const { 
        devices, 
        from, 
        realFrom, 
        to, 
        realTo, 
        isSatelite = false, 
        reportSections = {
            route: true,
            chart: true,
            alerts: true,
            summary: true
        }
    } = request.body

    // Validar campos obligatorios
    if (!devices || devices.length == 0 || !from || from == '' || !to || to == '' || !authorization || authorization == '' || !realFrom || realFrom == '' || !realTo || realTo == '') {
        return response.status(400).json({ error: true, msg: 'missing_fields_or_token' })
    }

    // Validar que al menos una sección esté seleccionada
    const hasSelectedSections = Object.values(reportSections).some(selected => selected === true);
    if (!hasSelectedSections) {
        return response.status(400).json({ 
            error: true, 
            msg: 'no_report_sections_selected',
            details: 'Al menos una sección del reporte debe estar seleccionada'
        })
    }

    switch (validateToken(authorization)) {
        case true:
            try {
                const devicesData = await getDevices(devices, from, to, authorization, realFrom, realTo)
                let pdfs = []

                try {
                    for (const device of devicesData.data) {
                        // Pasar reportSections al generador de PDF
                        const pdf = await pdfGenerator(device, realFrom, realTo, isSatelite, reportSections)
                        pdfs.push(pdf)
                    }
                } catch (error) {
                    console.error('Error generando PDFs:', error)
                    return response.status(400).json({ 
                        error: true, 
                        msg: `pdf_generation_error`,
                        details: error.message 
                    })
                }

                // Configurar headers para PDF
                response.setHeader('Content-Type', 'application/pdf')
                response.setHeader('Content-Disposition', 'attachment; filename="reporte-modular.pdf"')
                
                // Generar y enviar PDF combinado
                const mergedPDF = await mergePDFs(pdfs)
                response.status(200).send(mergedPDF)
                
            } catch (error) {
                console.error('Error en generación de reporte:', error)
                response.status(500).json({ 
                    error: true, 
                    msg: 'pdf_not_created', 
                    details: error.message 
                })
            }
            break

        case false:
            response.status(401).json({ error: true, msg: 'invalid_credentials' })
            break

        default:
            response.status(500).json({ error: true, msg: 'failed_system' })
            break
    }
}