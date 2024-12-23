import axios from 'axios'
import dotenv from 'dotenv'

export const getDevices = async (devices, from, to, token) => {
    dotenv.config()

    const configDevices = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.DEVICES,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'authorization': token
        },
        data: {
            devices,
            from,
            to
        }
    }

    try {
        const responseDevices = (await axios.request(configDevices)).data
        return responseDevices
    } catch (error) {
        console.error('Error fetching devices:', error)
        throw error
    }
}