import PuppeteerHTMLPDF from 'puppeteer-html-pdf'
import PDFMerger from 'pdf-merger-js'

export const pdfGenerator = async (coords, events, summary) => {
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
            top: '60px',
            bottom: '60px',
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
        </style>
    </head>
    <body>

        <div class="document">
            <h2>Reporte De Unidad: ${summary.deviceName}</h2>
            <h2>Ruta:</h2>
            <div id="map"></div>
            <br>
            
            <h2>Grafica De Eventos:</h2>
            <div id="chartdiv"></div>
            <br>

            <h2>Eventos:</h2>
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

            <h2>Resumen De Gasolina:</h2>
            <p><b>Distancia Recorrida (km):</b> ${summary.distance.toFixed(2)} km</p>
            <p><b>Rendimiento:</b> ${summary.averageSpeed.toFixed(2)} km por litro</p>
            <p><b>Combustible Gastado:</b> ${summary.spentFuel.toFixed(2)} litros</p>
        </div>

        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

        <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
        <script src="https://cdn.amcharts.com/lib/5/percent.js"></script>

        <script>
            var map = L.map('map', {zoomControl: false}).setView(${JSON.stringify(coords.coords[0])}, 10);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 10,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            var polyline = L.polyline(${JSON.stringify(coords.coords)}, {color: 'blue'}).addTo(map);

            map.fitBounds(polyline.getBounds());
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
        producer: "Reporte De Unidad",
        title: "OKIP"
    })

    const mergedPDFBuffer = await merger.saveAsBuffer()

    return mergedPDFBuffer
}