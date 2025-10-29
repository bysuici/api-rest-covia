import { pdfGenerator, mergePDFs, generateGeneralReport, radioPdfGenerator } from '../procedures/pdfGenerator.js'
import { validateToken } from '../procedures/validateToken.js'
import { getDevices, getDevicesGeneral } from '../procedures/devices.js'
import axios from 'axios'
import dotenv from 'dotenv'

export const report = async (request, response) => {
    const { authorization } = request.headers
    const {
        devices,
        from,
        realFrom,
        to,
        realTo,
        isSatelite = false,
        isLetterhead = false,
        color = '#000000',
        icon,
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
                        const pdf = await pdfGenerator(device, realFrom, realTo, isSatelite, reportSections, icon, color, isLetterhead)
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
        icon,
        color,
        isLetterhead,
        groupId,
        groupName,
        deviceNames,
        deviceDependencies,
        dependencies
    } = request.body

    if (!devices || devices.length == 0 || !from || from == '' || !to || to == '' || !authorization || authorization == '' || !realFrom || realFrom == '' || !realTo || realTo == '' || !groupId || !groupName || !deviceNames || deviceNames.length == 0 || !deviceDependencies || deviceDependencies.length == 0 || !dependencies || dependencies.length == 0) {
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
                const generalReportPDF = await generateGeneralReport(devicesData.data, groupId, groupName, deviceNames, realFrom, realTo, authorization, icon, color, isLetterhead, deviceDependencies, dependencies)
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

export const reportRadio = async (request, response) => {
    const { authorization } = request.headers
    const {
        radios,
        from,
        to,
        isSatelite = false,
        icon,
        color,
        isLetterhead,
        reportSections = {
            route: true,
            tableOfContents: true
        }
    } = request.body

    if (!radios || radios.length == 0 || !from || from == '' || !to || to == '' || !authorization || authorization == '') {
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
                const radiosData = await getRadios(radios, from, to, authorization, reportSections)
                let pdfs = []

                try {
                    for (const radio of radiosData.data) {
                        const pdf = await radioPdfGenerator(radio, from, to, isSatelite, reportSections, icon, color, isLetterhead)
                        pdfs.push(pdf)
                    }
                } catch (error) {
                    console.error('Error generando PDFs de radios:', error)
                    return response.status(400).json({
                        error: true,
                        msg: `radio_pdf_generation_error`,
                        details: error.message
                    })
                }

                response.setHeader('Content-Type', 'application/pdf')
                response.setHeader('Content-Disposition', 'attachment; filename="reporte-radios.pdf"')

                const mergedPDF = await mergePDFs(pdfs)
                response.status(200).send(mergedPDF)

            } catch (error) {
                console.error('Error en generación de reporte de radios:', error)
                response.status(500).json({
                    error: true,
                    msg: 'radio_pdf_not_created',
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

export const getRadios = async (radios, from, to, authorization, reportSections) => {
    dotenv.config()
    const url = process.env.DEVICES;
    try {
        // Hacer llamada a tu backend principal para obtener datos de radios
        const response = await axios.post(`${url}/generate-radio`, {
            radios,
            from,
            to,
            reportSections
        }, {
            headers: {
                authorization
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching radio data:', error);
        throw new Error(`Error fetching radio data: ${error.message}`);
    }
}