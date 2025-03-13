import { pdfGenerator, mergePDFs } from '../procedures/pdfGenerator.js'
import { validateToken } from '../procedures/validateToken.js'
import { getDevices } from '../procedures/devices.js'

export const report = async (request, response) => {
    const { authorization } = request.headers
    const { devices, from, realFrom, to, realTo, isSatelite = false } = request.body

    if (!devices || devices.length == 0 || !from || from == '' || !to || to == '' || !authorization || authorization == '' || !realFrom || realFrom == '' || !realTo || realTo == '') {
        return response.status(400).json({ error: true, msg: 'missing_fields_or_token' })
    } else {
        switch (validateToken(authorization)) {
            case true:
                try {
                    const devicesData = await getDevices(devices, from, to, authorization, realFrom, realTo)
                    let pdfs = []

                    try {
                        for (const device of devicesData.data) {
                            const pdf = await pdfGenerator(device, realFrom, realTo, isSatelite)

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