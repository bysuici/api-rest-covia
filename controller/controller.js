import axios from 'axios'
import nodeHtmlToImage from 'node-html-to-image'
import dotenv from 'dotenv'

export const report = async (request, response) => {
    const { devices, from, to } = request.body
    let strDevices = '?', listCoords = []
    let strGas = '?', strEvento = '?'
    let arrDevices = JSON.parse(JSON.stringify(devices))

    //* Configurar dotenv
    dotenv.config()

    //* Iteracion total de devicesId
    arrDevices.forEach((id) => {
        strDevices = strEvento + 'deviceId=' + id + '&'
    })

    //* Path completo para endpoint de gas
    strGas = strDevices + 'from=' + from + '&to=' + to

    //* Path completo para endpoint de eventos
    strEvento = strDevices + 'type=AllEvents&from=' + from + '&to=' + to

    //* Path completo para endpoint de devices
    strDevices = strDevices + 'from=' + from + '&to=' + to

    const configRuta = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.ruta + strDevices,
        headers: {
            'Authorization': 'Bearer GImfoFIg52vJcBn9lvuP1c363Os6dbgu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    const configGas = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.gas + strGas,
        headers: {
            'Authorization': 'Bearer GImfoFIg52vJcBn9lvuP1c363Os6dbgu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    const configEvento = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.evento + strEvento,
        headers: {
            'Authorization': 'Bearer GImfoFIg52vJcBn9lvuP1c363Os6dbgu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    const responseRuta = await axios.request(configRuta)
    const responseGas = await axios.request(configGas)
    const responseEvento = await axios.request(configEvento)

    //* Eliminar coordenadas en 0
    let dataRuta = []

    responseRuta.data.forEach((ruta) => {
        if (ruta.speed != 0) {
            dataRuta.push(ruta)
        }
    })

    return response.json(dataRuta)



    // for (let i = 0; i < responseRuta.data.length; i++) {
    //     const found = listCoords.find((item) => {
    //         item.id == responseRuta.data[i].deviceId
    //     })

    //     if (found) {
    //         found.coords.push({ latitude: responseRuta.data[i].latitude, longitude: responseRuta.data[i].longitude })
    //     } else {
    //         listCoords.push({ id: responseRuta.data[i].deviceId, coords: [{ latitude: responseRuta.data[i].latitude, longitude: responseRuta.data[i].longitude }] })
    //     }
    // }

    // nodeHtmlToImage({
    //     output: '/image.png',
    //     html:
    //         `
    //             <!DOCTYPE html>
    //             <html>
    //             <head>
    //             <title>OpenStreetMap Example</title>
    //             <meta charset="utf-8" />
    //             <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //             <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    //             <style>
    //                #map { height: 600px; }
    //             </style>
    //             </head>
    //             <body>
    //                 <div id="map"></div>
    //                 <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    //                 <script>
    //                     // Inicializa el mapa y establece la vista inicial
    //                     var map = L.map('map').setView([51.505, -0.09], 13);

    //                     // Añade la capa de OpenStreetMap
    //                     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //                         maxZoom: 19,
    //                         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    //                     }).addTo(map);

    //                     // Lista de coordenadas
    //                     var coords = [
    //                         [51.505, -0.09],
    //                         [51.51, -0.1],
    //                         [51.51, -0.12]
    //                     ];

    //                     // Dibuja el recorrido usando un Polyline
    //                     var polyline = L.polyline(coords, {color: 'blue'}).addTo(map);

    //                     // Ajusta la vista del mapa para que se ajuste al recorrido
    //                     map.fitBounds(polyline.getBounds());
    //                 </script>
    //             </body>
    //             </html>
    //         `
    // }).then(() => { console.log('The image was created successfully!') })

    // return response.status(200).json({ data: listCoords })
}