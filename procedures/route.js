import dotenv from 'dotenv'
import axios from 'axios'

export const getCoords = async (devices, from, to, token) => {
    let strDevices = '?'

    //* Configurar dotenv
    dotenv.config()

    //* Iteracion total de devicesId
    devices.forEach((id) => {
        strDevices = strDevices + 'deviceId=' + id + '&'
    })

    //* Path completo para endpoint de devices
    strDevices = strDevices + 'from=' + from + '&to=' + to

    const configRuta = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.ruta + strDevices,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    const responseRuta = await axios.request(configRuta)

    //* Eliminar coordenadas en 0
    let dataReports = []

    responseRuta.data.forEach((ruta) => {
        if (ruta.speed != 0) {
            dataReports.push(ruta)
        }
    })

    //* Armar JSON con id y las coordenadas

    let routeData = []

    devices.forEach((id) => {
        const reports = dataReports.filter(report => report.deviceId == id)

        let coords = reports.map(report => ([
            report.latitude,
            report.longitude
        ]))

        const objRoute = {
            deviceId: id,
            coords: coords
        }

        routeData.push(objRoute)
    })

    return routeData
}