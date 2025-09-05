import axios from 'axios'
import dotenv from 'dotenv'

export const getDevices = async (devices, from, to, token, realFrom, realTo, reportSections = {}) => {
    dotenv.config()
    const url = process.env.DEVICES;

    const configDevices = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${url}/generate`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'authorization': token
        },
        data: {
            devices,
            from,
            to,
            realFrom,
            realTo,
            reportSections
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

export const getDevicesGeneral = async (devices, from, to, token, realFrom, realTo, deviceNames, groupId, groupName) => {
    dotenv.config()

    const configDevices = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api-covia.okip.com.mx/api/reports/generateGeneral',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'authorization': token
        },
        data: {
            devices,
            from,
            to,
            realFrom,
            realTo,
            deviceNames,
            groupId,
            groupName
        }
    }

    try {
        const responseDevices = (await axios.request(configDevices)).data
        return responseDevices
    } catch (error) {
        console.error('Error fetching devices for general report:', error)
        throw error
    }
}