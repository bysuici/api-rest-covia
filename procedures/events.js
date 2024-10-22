import axios from 'axios'
import dotenv from 'dotenv'

export const getEvents = async (devices, from, to, token) => {
    let strDevices = '?'

    //* Configurar dotenv
    dotenv.config()

    //* Iteracion total de devicesId
    devices.forEach((id) => {
        strDevices = strDevices + 'deviceId=' + id + '&'
    })

    //* Path completo para endpoint de events
    strDevices = strDevices + 'type=allEvents&' + 'from=' + from + '&to=' + to

    //* Configuracion de envio de axios
    const configEvents = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.evento + strDevices,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    const responseEvents = await axios.request(configEvents)

    let dataEvents = []

    responseEvents.data.forEach((event) => {
        if (event.attributes.descripcion) {
            dataEvents.push(event)
        }
    })

    let allEvents = []

    devices.forEach((deviceId) => {
        const events = dataEvents.filter((event) => event.deviceId == deviceId)

        let categoryCount = {}

        events.forEach((event) => {
            let category = event.attributes.descripcion

            if (categoryCount[category]) {
                categoryCount[category] += 1
            } else {
                categoryCount[category] = 1
            }
        })

        let categoryArray = Object.keys(categoryCount).map((key) => ({
            category: key,
            value: categoryCount[key]
        }))

        let objEvent = {
            deviceId: deviceId,
            eventCategories: categoryArray
        }

        allEvents.push(objEvent)
    })

    return allEvents
}