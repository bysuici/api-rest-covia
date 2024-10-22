import axios from 'axios'
import dotenv from 'dotenv'

export const getDevices = async (devices, token) => {
    dotenv.config()

    const configDevices = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.devices,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    const responseDevices = await axios.request(configDevices)

    const allDevices = responseDevices.data.filter(device => devices.includes(device.id))

    return allDevices
}