import PuppeteerHTMLPDF from 'puppeteer-html-pdf'
import PDFMerger from 'pdf-merger-js'
import moment from 'moment'

export const pdfGenerator = async (device, from, to) => {
    moment.locale('es')
    const htmlPDF = new PuppeteerHTMLPDF()
    const options = {
        format: 'A4',
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            *{
                margin: 0;
                padding: 0;
                font-family: Arial, Helvetica, sans-serif;
            }

            #map {
                height: 400px;
                border-radius: 20px;
                overflow: hidden;
            }

            #chartdiv {
                width: 100%;
                height: 500px;
            }
        </style>
    </head>
    <body>

        <div class="flex flex-col my-[15px] mx-[68px]">
            <div class="flex items-center justify-between mb-2">
                <div class="flex flex-col gap-0">
                    <span class="text-[14px] font-bold underline">INFORME GENERAL</span>
                    <span class="text-[11px] font-bold">San Miguel de Allende, Gto.</span>
                    <span class="text-[11px]">Los parámetros utilizados para el presente informe corresponden del</span>
                    <span class="text-[11px]"><u>${moment(from).utcOffset(0).format('D [de] MMMM [del] YYYY, HH:mm:ss')}</u> al <u>${moment(to).utcOffset(0).format('D [de] MMMM [del] YYYY, HH:mm:ss')}</u></span>
                </div>
                <div>
                    <img src="https://res.cloudinary.com/dfvro9k4k/image/upload/v1736532408/Covia/hhukhjekxej4eowsueiu.png" width="40" height="40">
                </div>
            </div>
            <div class="bg-[#071952] py-[2px] mb-2"></div>

            <h3 class="font-bold mb-2 text-[15px]">Reporte De Unidad: <u>${device.summary.name}</u></h3>
            <h3 class="font-bold mb-2 text-[15px]">Ruta Recorrida:</h3>
            <div id="map"></div>
            
            <h3 class="font-bold my-2 text-[15px]">Gráfica De Alertas:</h3>
            ${device.alerts.length > 0 ? '<div id="chartdiv"></div>' : '<p class="text-2xl h-[200px] flex items-center justify-center">No hay alertas registradas</p>'}

            <h3 class="font-bold mb-4 mt-12 text-[15px]">Listado De Alertas:</h3>
            <table class="text-[13px]">
                ${device.alerts.map(alert => `
                <tr>
                    <td style="padding: 5px 50px 5px 30px; background: #e4e4e4">${alert.category}</td>
                    <td style="padding: 5px 30px 5px 30px; background: #efefef; text-align: center;">${alert.value}</td>
                </tr>
                `).join('')}
            </table>

            <h3 class="font-bold mt-4 mb-2 text-[15px]">Resumen De Gasolina:</h3>
            <p class="text-[13px]"><b>Distancia Recorrida (km):</b> ${!device.summary.kilometers_traveled ? '0' : device.summary.kilometers_traveled == 0 ? '0' : device.summary.kilometers_traveled == null ? '0' : device.summary.kilometers_traveled} km</p>
            <p class="text-[13px]"><b>Rendimiento:</b> ${!device.summary.km_per_liter ? '0' : device.summary.km_per_liter} km/litro</p>
            <p class="text-[13px] mb-6"><b>Combustible Gastado:</b> ${!device.summary.spent_gas ? '0' : device.summary.spent_gas == 0 ? '0' : device.summary.spent_gas == null ? '0' : device.summary.spent_gas} Litro(s)</p>

            <div style="background: #071952; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-symbols-outlined" style="color: white; font-size: 13px; background: #071952;">call</span>
                    <span style="color: white; font-size: 12px; font-weight: 400">+521 56 3173 4229</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-symbols-outlined" style="color: white; font-size: 13px; background: #071952;">location_on</span>
                    <span style="color: white; font-size: 12px; font-weight: 400"> Camino a cruz del palmar 204, SMA. GTO.</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-symbols-outlined" style="color: white; font-size: 13px; background: #071952;">language</span>
                    <span style="color: white; font-size: 12px; font-weight: 400">www.okip.com.mx</span>
                </div>
            </div>
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
            }).setView(${JSON.stringify(device.coordinates[0]) != null ? JSON.stringify(device.coordinates[0]) : '[20.914266, -100.743788]'}, ${JSON.stringify(device.coordinates[0]) != null ? '5' : '7.5'});

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 10,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            var polyline = L.polyline(${JSON.stringify(device.coordinates)}, {color: 'blue'}).addTo(map);
            map.fitBounds(polyline.getBounds());
        </script>

        <script>
            am5.ready(function() {
                var root = am5.Root.new("chartdiv");

                var customColorSet = am5.ColorSet.new(root, {
                    colors: [
                        ${device.alerts
                            .filter(alert => alert.value > 0)
                            .map(alert => `am5.color(0x${alert.color.slice(1)})`)
                            .join(',')} // Une los colores en un solo string
                    ]
                });

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

                series.set("colors", customColorSet);


                series.data.setAll(${JSON.stringify(device.alerts.filter(alert => alert.value !== 0))});
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

                legend.labels.template.setAll({
                    fontSize: 13
                });

                legend.valueLabels.template.setAll({
                    fontSize: 13
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