import PuppeteerHTMLPDF from 'puppeteer-html-pdf'
import PDFMerger from 'pdf-merger-js'
import moment from 'moment'

export const pdfGenerator = async (coords, events, summary, page, totalPage, from, to) => {
    moment.locale('es')
    const htmlPDF = new PuppeteerHTMLPDF()
    const options = {
        format: 'A4',
        displayHeaderFooter: false,
        headerTemplate: `
            <div style="font-size: 12px; width: 100%; padding: 20px 65px; color: #333;">
                <b>OKIP</b>
            </div>
        `,
        footerTemplate: '',
        margin: {
            top: '0px',
            bottom: '0px',
            left: '60px',
            right: '60px'
        },
        printBackground: true
    }

    htmlPDF.setOptions(options)

    const CONTENT = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>OpenStreetMap Example</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <style>
            *{
                font-family: Arial, Helvetica, sans-serif;
            }

            #map {
                height: 300px;
                border-radius: 20px;
                overflow: hidden;
            }

            #chartdiv {
                width: 100%;
                height: 200px;
            }
                
            .header {
                margin-top: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0px
            }
        </style>
    </head>
    <body>

        <div class="document">
            <div class="header">
                <div>
                    <span style="font-size: 11px;">CIBERSEGURIDAD Y TECNOLOGÍA</span>
                </div>
                <div>
                    <img src="https://okip.com.mx/_next/static/media/logoblue_okip.b68f643c.webp" width="40" height="40">
                </div>
            </div>
            <div style="background: #071952; padding: 3px; border-radius: 30px; margin: 0px 0px 20px 0px;"></div>

            <h3>Reporte De Unidad: <u>${summary.deviceName}</u></h3>
            <div style="display: flex; align-items: center;">
                <h3 style="margin: 0; margin-right: 10px;">Fecha: </h3>
                <span>Del ${moment(from).format('D [de] MMMM [del] YYYY')} al ${moment(to).format('D [de] MMMM [del] YYYY')}</span>
            </div>
            <h3>Ruta Recorrida:</h3>
            <div id="map"></div>
            <br>
            
            <h3>Gráfica De Eventos:</h3>
            <div id="chartdiv"></div>
            <br>

            <h3>Listado De Eventos:</h3>
            <table>
                <tr>
                    <td style="padding: 8px 30px; background: #e4e4e4">Activacion De Boton De Panico</td>
                    <td style="padding: 8px 30px; background: #efefef">${events.eventCategories.find((event) => event.category == 'ACTIVACION DE BOTON DE PANICO') ? events.eventCategories.find((event) => event.category == 'ACTIVACION DE BOTON DE PANICO').value : '0'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 30px; background: #e4e4e4">Alerta De Acercamiento De Colision</td>
                    <td style="padding: 8px 30px; background: #efefef">${events.eventCategories.find((event) => event.category == 'ALERTA DE ACERCAMIENTO DE COLISION') ? events.eventCategories.find((event) => event.category == 'ALERTA DE ACERCAMIENTO DE COLISION').value : '0'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 30px; background: #e4e4e4">Conductor Distraido</td>
                    <td style="padding: 8px 30px; background: #efefef">${events.eventCategories.find((event) => event.category == 'CONDUCTOR DISTRAIDO') ? events.eventCategories.find((event) => event.category == 'CONDUCTOR DISTRAIDO').value : '0'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 30px; background: #e4e4e4">Deteccion De Telefono</td>
                    <td style="padding: 8px 30px; background: #efefef">${events.eventCategories.find((event) => event.category == 'DETECCION DE TELEFONO') ? events.eventCategories.find((event) => event.category == 'DETECCION DE TELEFONO').value : '0'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 30px; background: #e4e4e4">Salida De Carril</td>
                    <td style="padding: 8px 30px; background: #efefef">${events.eventCategories.find((event) => event.category == 'SALIDA DE CARRIL') ? events.eventCategories.find((event) => event.category == 'SALIDA DE CARRIL').value : '0'}</td>
                </tr>
            </table>
            <br>

            <h3>Resumen De Gasolina:</h3>
            <p><b>Distancia Recorrida (km):</b> ${summary.distance.toFixed(2)} km</p>
            <p><b>Rendimiento:</b> ${summary.averageSpeed.toFixed(2)} km por litro</p>
            <p><b>Combustible Gastado:</b> ${summary.spentFuel.toFixed(2)} litros</p>

            <div style="background: #071952; padding: 3px; border-radius: 30px; margin: 20px 0px"></div>
            <center><span style="font-size: 11px;">${page}/${totalPage}</span></center>
        </div>

        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

        <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
        <script src="https://cdn.amcharts.com/lib/5/percent.js"></script>

        <script>
            var map = L.map('map',{
                zoomControl: false,
                zoomAnimation: false,
                fadeAnimation: false,
                markerZoomAnimation: false
            }).setView(${JSON.stringify(coords.coords[0])}, 10);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 10,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            var polyline = L.polyline(${JSON.stringify(coords.coords)}, {color: 'blue'}).addTo(map);
            map.fitBounds(polyline.getBounds());

            var startMarker = L.marker(${JSON.stringify(coords.coords[0])}, {icon: L.icon({iconUrl: 'https://example.com/start-icon.png'})}).addTo(map);
            startMarker.bindPopup('Inicio del viaje');

            var endMarker = L.marker(${JSON.stringify(coords.coords[coords.length - 1])}, {icon: L.icon({iconUrl: 'https://example.com/end-icon.png'})}).addTo(map);
            endMarker.bindPopup('Fin del viaje');

            // Opcional: Añade un marcador para todos los puntos del viaje
            coords.forEach(function(coord) {
                L.marker(coord).addTo(map);
            });
        </script>

        <script>
            am5.ready(function() {
                var root = am5.Root.new("chartdiv");

                var chart = root.container.children.push( 
                        am5percent.PieChart.new(root, {
                        layout: root.horizontalLayout
                    }) 
                );

                var series = chart.series.push(
                    am5percent.PieSeries.new(root, {
                        valueField: "value",
                        categoryField: "category",
                        endAngle: 270
                    })
                );

                series.data.setAll(${JSON.stringify(events.eventCategories)});
                series.labels.template.set("forceHidden", true);
                series.ticks.template.set("forceHidden", true);

                var legend = chart.children.push(am5.Legend.new(root, {
                    centerY: am5.percent(50),
                    y: am5.percent(50),
                    layout: root.verticalLayout
                }));

                legend.markerRectangles.template.setAll({
                    cornerRadiusTL: 10,
                    cornerRadiusTR: 10,
                    cornerRadiusBL: 10,
                    cornerRadiusBR: 10
                });

                legend.data.setAll(series.dataItems);
            });
        </script>
    </body>
    </html>
    `
    const PDF = await htmlPDF.create(CONTENT)

    return PDF
}

export const mergePDFs = async (pdfBuffers) => {
    let merger = new PDFMerger()

    for (const pdfBuffer of pdfBuffers) {
        await merger.add(pdfBuffer)
    }

    await merger.setMetadata({
        producer: "Reporte",
        title: "OKIP"
    })

    const mergedPDFBuffer = await merger.saveAsBuffer()

    return mergedPDFBuffer
}