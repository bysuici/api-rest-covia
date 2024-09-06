import axios from 'axios'
import dotenv from 'dotenv'

export const getSummary = async (devices, from, to) => {
    let strDevices = '?'

    //* Configurar dotenv
    dotenv.config()

    //* Iteracion total de devicesId
    devices.forEach((id) => {
        strDevices = strDevices + 'deviceId=' + id + '&'
    })

    //* Path completo para endpoint de devices
    strDevices = strDevices + 'from=' + from + '&to=' + to

    const configGas = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.gas + strDevices,
        headers: {
            'Authorization': 'Bearer GImfoFIg52vJcBn9lvuP1c363Os6dbgu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    const responseGas = await axios.request(configGas)

    let dataGas = []

    responseGas.data.forEach((gas) => {
        const objGas = {
            deviceId: gas.deviceId,
            deviceName: gas.deviceName,
            distance: gas.distance,
            averageSpeed: gas.averageSpeed,
            spentFuel: gas.spentFuel
        }

        dataGas.push(objGas)
    })

    return dataGas
}