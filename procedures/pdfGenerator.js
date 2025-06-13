import PuppeteerHTMLPDF from 'puppeteer-html-pdf'
import PDFMerger from 'pdf-merger-js'
import moment from 'moment'
import { alerts } from '../utils/utils.js'

export const pdfGenerator = async (device, from, to, isSatelite, reportSections = {}) => {
    moment.locale('es')
    const htmlPDF = new PuppeteerHTMLPDF()
    const options = {
        format: 'A4',
        printBackground: true
    }

    htmlPDF.setOptions(options)

    // Verificar qué secciones están habilitadas
    const {
        route = true,
        chart = true,
        alerts: includeAlerts = true,
        summary = true
    } = reportSections;

    // Funciones para generar cada sección
    const generateRouteSection = () => {
        if (!route) return '';
        const hasCoordinates = device.coordinates && device.coordinates.length > 0;

        return `
        <h3 class="font-bold mb-2 text-[15px]">Ruta Recorrida:</h3>
        <div id="map" class="relative h-[400px] rounded-2xl overflow-hidden bg-gray-200">
            ${!hasCoordinates
                ? `<div class="absolute inset-0 flex items-center justify-center bg-gray-200 text-red-600 text-2xl font-bold">
                      No Hay Movimiento
                   </div>`
                : ''
            }
        </div>
    `;
    };

    const generateChartSection = () => {
        if (!chart) return '';
        return `
            <h3 class="font-bold my-2 text-[15px]">Gráfica De Alertas:</h3>
            ${device.alerts.length > 0 ? '<div id="chartdiv"></div>' : '<p class="text-2xl h-[200px] flex items-center justify-center">No hay alertas registradas</p>'}
        `;
    };

    const generateAlertsSection = () => {
        if (!includeAlerts) return '';
        return `
            <h3 class="font-bold mb-4 mt-12 text-[15px]">Listado De Alertas:</h3>
            <table class="text-[13px]">
                ${device.alerts.filter(alert => ![
            'Persona peligrosidad baja',
            'Persona peligrosidad media',
            'Persona peligrosidad alta',
            'Reconocimiento de placa',
            'Personal reconocido',
            'Persona no reconocida',
            'Fin del recorrido',
            'Alerta de geo-cercado',
            'Advertencia de colisión de peatones',
            'Alerta de cambios anormales de temperatura',
        ].includes(alert.category)).map(alert => `
                <tr>
                    <td style="padding: 5px 50px 5px 30px; background: #e4e4e4">${alert.category}</td>
                    <td style="padding: 5px 30px 5px 30px; background: #efefef; text-align: center;">${alert.value}</td>
                </tr>
                `).join('')}
            </table>
        `;
    };

    const generateSummarySection = () => {
        if (!summary) return '';
        const safeValue = (value, unit = '') => {
            const numValue = value == null || value === 0 || !value ? '0' : value;
            return `${numValue}${unit}`;
        };

        return `
            <h3 class="font-bold mt-6 mb-4 text-[15px] text-[#071952]">Resumen de Combustible</h3> 
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: #071952; color: white;">
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border: 1px solid #071952;">Parametros</th>
                            <th style="padding: 12px 15px; text-align: center; font-weight: 600; border: 1px solid #071952;">Valor</th>
                            <th style="padding: 12px 15px; text-align: center; font-weight: 600; border: 1px solid #071952;">Unidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background: white;">
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 500;">Distancia Recorrida</td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center; font-weight: 600; color: #071952;">
                                ${safeValue(device.summary.kilometers_traveled)}
                            </td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center;">km</td>
                        </tr>
                        <tr style="background: #f8f9fa;">
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 500;">Rendimiento</td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center; font-weight: 600; color: #071952;">
                                ${safeValue(device.summary.km_per_liter)}
                            </td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center;">km/litro</td>
                        </tr>
                        <tr style="background: white;">
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 500;">Combustible Gastado</td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center; font-weight: 600; color: #071952;">
                                ${safeValue(device.summary.spent_gas)}
                            </td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center;">Litros</td>
                        </tr>
                    </tbody>
                </table>
        `;
    };

    // Script del mapa (solo si la sección de ruta está habilitada)
    const generateMapScript = () => {
        if (!route || !device.coordinates || device.coordinates.length === 0) return '';

        return `
        <script>
            var map = L.map('map', {
                zoomControl: false,
                zoomAnimation: false,
                fadeAnimation: false,
                markerZoomAnimation: false
            });

            var isSatelite = ${isSatelite};

            if (isSatelite) {
                const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    maxZoom: 18,
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
                });

                const labelsLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
                    maxZoom: 18,
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
                });

                L.layerGroup([satelliteLayer, labelsLayer]).addTo(map);
            } else {
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 18,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
            }

            var coordinates = ${JSON.stringify(device.coordinates)};
            if (coordinates.length !== 1) {
                var polyline = L.polyline(coordinates, { color: 'blue' }).addTo(map);
                var bounds = polyline.getBounds();
                map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
            } else {
                var marker = L.marker(coordinates[0]).addTo(map);
                map.setView(coordinates[0], 14);
            }
        </script>
    `;
    };

    // Script de la gráfica (solo si la sección de gráfica está habilitada)
    const generateChartScript = () => {
        if (!chart || device.alerts.length === 0) return '';
        return `
            <script>
                am5.ready(function() {
                    var root = am5.Root.new("chartdiv");

                    var customColorSet = am5.ColorSet.new(root, {
                        colors: [
                            ${device.alerts
                .filter(alert => alert.value > 0)
                .map(deviceAlert => {
                    const matchedAlert = alerts.find(a => a.alert === deviceAlert.category);
                    return matchedAlert ? `am5.color(0x${matchedAlert.color.slice(1)})` : `am5.color(0x${deviceAlert.color.slice(1)})`;
                })
                .join(',')
            } // Une los colores en un solo string
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
        `;
    };

    // Determinar qué librerías cargar según las secciones habilitadas
    const getRequiredLibraries = () => {
        let libraries = [];

        if (route) {
            libraries.push('<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>');
        }

        if (chart && device.alerts.length > 0) {
            libraries.push('<script src="https://cdn.amcharts.com/lib/5/index.js"></script>');
            libraries.push('<script src="https://cdn.amcharts.com/lib/5/percent.js"></script>');
        }

        return libraries.join('\n        ');
    };

    // Determinar qué estilos CSS cargar según las secciones habilitadas
    const getRequiredStyles = () => {
        let leafletCSS = '';
        let mapStyles = '';
        let chartStyles = '';

        if (route) {
            leafletCSS = '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />';
            mapStyles = `
            #map {
                height: 400px;
                border-radius: 20px;
                overflow: hidden;
            }`;
        }

        if (chart) {
            chartStyles = `
            #chartdiv {
                width: 100%;
                height: 500px;
            }`;
        }

        return { leafletCSS, mapStyles, chartStyles };
    };

    const { leafletCSS, mapStyles, chartStyles } = getRequiredStyles();

    const CONTENT = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>OpenStreetMap Example</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${leafletCSS}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            *{
                margin: 0;
                padding: 0;
                font-family: Arial, Helvetica, sans-serif;
            }
            ${mapStyles}
            ${chartStyles}
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
            </div>
            <div class="bg-[#071952] py-[2px] mb-2"></div>

            <h3 class="font-bold mb-2 text-[15px]">Reporte De Unidad: <u>${device.summary.name}</u></h3>
            
            ${generateRouteSection()}
            ${generateChartSection()}
            ${generateAlertsSection()}
            ${generateSummarySection()}
        </div>

        <!-- Cargar librerías JavaScript -->
        ${route ? '<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>' : ''}
        ${(chart && device.alerts.length > 0) ? '<script src="https://cdn.amcharts.com/lib/5/index.js"></script>' : ''}
        ${(chart && device.alerts.length > 0) ? '<script src="https://cdn.amcharts.com/lib/5/percent.js"></script>' : ''}
        
        <!-- Scripts de inicialización -->
        ${generateMapScript()}
        ${generateChartScript()}
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