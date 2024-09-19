import { getCoords } from '../procedures/route.js'
import { getEvents } from '../procedures/events.js'
import { getSummary } from '../procedures/summary.js'
import { pdfGenerator, mergePDFs } from '../procedures/pdfGenerator.js'
import { validateToken } from '../procedures/validateToken.js'

export const report = async (request, response) => {
    const { devices, from, to, token } = request.body

    if (!devices || devices.length == 0 || !from || from == '' || !to || to == '' || !token || token == '') {
        return response.status(400).json({ error: true, msg: 'missing_or_empty_fields' })
    } else {
        switch (validateToken(token)) {
            case true:
                try {
                    const coords = await getCoords(devices, from, to, token)
                    const events = await getEvents(devices, from, to, token)
                    const summary = await getSummary(devices, from, to, token)
                    let page = 1
                    let pdfs = []

                    try {
                        for (const deviceId of devices) {
                            const coordsById = coords.find((coord) => coord.deviceId == deviceId)
                            const eventsById = events.find((event) => event.deviceId == deviceId)
                            const summaryById = summary.find((summary) => summary.deviceId == deviceId)

                            const pdf = await pdfGenerator(coordsById, eventsById, summaryById, from, to)

                            pdfs.push(pdf)
                        }
                    } catch (error) {
                        response.status(400).json({ error: true, msg: 'token_not_valid' })
                    }

                    response.setHeader('Content-Type', 'application/pdf')
                    response.status(200).send(await mergePDFs(pdfs))
                } catch (error) {
                    response.status(400).json({ error: true, msg: 'pdf_not_created' })
                }
                break

            case false:
                response.status(400).json({ error: true, msg: 'invalid_credentials' })
                break

            default:
                response.status(400).json({ error: true, msg: 'failed_system' })
                break
        }
    }
}