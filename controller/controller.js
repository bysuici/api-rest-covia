import { getCoords } from '../procedures/route.js'
import { getEvents } from '../procedures/events.js'
import { getSummary } from '../procedures/summary.js'
import { pdfGenerator, mergePDFs } from '../procedures/pdfGenerator.js'

export const report = async (request, response) => {
    const { devices, from, to } = request.body
    const coords = await getCoords(devices, from, to)
    const events = await getEvents(devices, from, to)
    const summary = await getSummary(devices, from, to)

    let pdfs = []

    for (const deviceId of devices) {
        const coordsById = coords.find((coord) => coord.deviceId == deviceId)
        const eventsById = events.find((event) => event.deviceId == deviceId)
        const summaryById = summary.find((summary) => summary.deviceId == deviceId)

        const pdf = await pdfGenerator(coordsById, eventsById, summaryById)

        pdfs.push(pdf)
    }

    response.setHeader('Content-Type', 'application/pdf')
    response.send(await mergePDFs(pdfs))
}