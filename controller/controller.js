import { pdfGenerator, mergePDFs, generateGeneralReport } from '../procedures/pdfGenerator.js'
import { validateToken } from '../procedures/validateToken.js'
import { getDevices, getDevicesGeneral } from '../procedures/devices.js'

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

    if (!devices || devices.length == 0 || !from || from == '' || !to || to == '' || !authorization || authorization == '' || !realFrom || realFrom == '' || !realTo || realTo == '') {
        return response.status(400).json({ error: true, msg: 'missing_fields_or_token' })
    }

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
                const devicesData = await getDevices(devices, from, to, authorization, realFrom, realTo, reportSections)
                let pdfs = []

                try {
                    for (const device of devicesData.data) {
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

                response.setHeader('Content-Type', 'application/pdf')
                response.setHeader('Content-Disposition', 'attachment; filename="reporte-individual.pdf"')
                
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

export const reportGeneral = async (request, response) => {
    const { authorization } = request.headers
    const { 
        devices, 
        from, 
        realFrom, 
        to, 
        realTo, 
        groupId,
        groupName,
        deviceNames
    } = request.body

    if (!devices || devices.length == 0 || !from || from == '' || !to || to == '' || !authorization || authorization == '' || !realFrom || realFrom == '' || !realTo || realTo == '' || !groupId || !groupName || !deviceNames || deviceNames.length == 0) {
        return response.status(400).json({ 
            error: true, 
            msg: 'missing_fields_or_token',
            details: 'Faltan campos obligatorios para el reporte general: devices, from, to, realFrom, realTo, groupId, groupName, deviceNames, authorization'
        })
    }

    switch (validateToken(authorization)) {
        case true:
            try {
                const devicesData = await getDevicesGeneral(devices, from, to, authorization, realFrom, realTo, deviceNames, groupId, groupName)
                const generalReportPDF = await generateGeneralReport(devicesData.data, groupId, groupName, deviceNames, realFrom, realTo, authorization)
                const filename = `reporte-general-${groupName.replace(/\s+/g, '-').toLowerCase()}.pdf`
                response.setHeader('Content-Type', 'application/pdf')
                response.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
                
                response.status(200).send(generalReportPDF)
                
            } catch (error) {
                console.error('Error generando reporte general:', error)
                return response.status(400).json({ 
                    error: true, 
                    msg: `general_report_generation_error`,
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