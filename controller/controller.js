import { pdfGenerator, mergePDFs } from '../procedures/pdfGenerator.js'
import { validateToken } from '../procedures/validateToken.js'
import { getDevices } from '../procedures/devices.js'

export const report = async (request, response) => {
    const { authorization } = request.headers
    const { devices, from, to } = request.body

    if (!devices || devices.length == 0 || !from || from == '' || !to || to == '' || !authorization || authorization == '') {
        return response.status(400).json({ error: true, msg: 'missing_fields_or_token' })
    } else {
        switch (validateToken(authorization)) {
            case true:
                try {
                    const devicesData = await getDevices(devices, from, to, authorization)
                    let pdfs = []

                    try {
                        for (const device of devicesData.data) {
                            const pdf = await pdfGenerator(device, from, to)

                            pdfs.push(pdf)
                        }
                    } catch (error) {
                        response.status(400).json({ error: true, msg: `token_not_valid ${error}` })
                    }

                    response.setHeader('Content-Type', 'application/pdf')
                    response.status(200).send(await mergePDFs(pdfs))
                } catch (error) {
                    response.status(400).json({ error: true, msg: 'pdf_not_created', error_txt: error })
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