export const configRuta = {
    method: 'get',
    maxBodyLength: Infinity,
    url: process.env.ruta + strDevices,
    headers: {
        'Authorization': 'Basic ' + btoa(process.env.upwd),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
}

export const configGas = {
    method: 'get',
    maxBodyLength: Infinity,
    url: process.env.gas + strGas,
    headers: {
        'Authorization': 'Basic ' + btoa(process.env.upwd),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
}

export const configEvento = {
    method: 'get',
    maxBodyLength: Infinity,
    url: process.env.evento + strEvento,
    headers: {
        'Authorization': 'Basic ' + btoa(process.env.upwd),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
}