import PuppeteerHTMLPDF from 'puppeteer-html-pdf'
import PDFMerger from 'pdf-merger-js'
import moment from 'moment'
import { alerts } from '../utils/utils.js'

export const pdfGenerator = async (device, from, to, isSatelite, reportSections = {}, icon, color, isLetterhead) => {
    moment.locale('es')
    const htmlPDF = new PuppeteerHTMLPDF()
    const options = {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: {
            top: '0',
            bottom: '0',
            left: '0',
            right: '0'
        }
    };

    htmlPDF.setOptions(options)

    const {
        route = true,
        chart = true,
        alerts: includeAlerts = true,
        summary = true
    } = reportSections;

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

    const generateSpeedLineChartSection = () => {
        if (!chart || !route || !device.speeds || device.speeds.length < 2) return ''; 

        return `
            <h3 class="font-bold my-2 text-[15px]">Historial de Velocidad:</h3>
            <div id="speedLineChartDiv" class="w-full h-[350px]"></div>
        `;
    };

    const generateSpeedLineChartScript = () => {
        if (!chart || !route || !device.speeds || device.speeds.length === 0) return '';

        const datesArray = device.routeDates || [];

        return `
            <script>
                am5.ready(function() {
                    // 1. Preparar datos
                    var speeds = ${JSON.stringify(device.speeds)};
                    var dates = ${JSON.stringify(datesArray)};
                    var chartData = [];

                    // Si no hay fechas, usamos índice numérico para que no falle
                    var useIndex = dates.length === 0;

                    for (var i = 0; i < speeds.length; i++) {
                        if (speeds[i] !== undefined) {
                            var dataPoint = { value: speeds[i] };
                            
                            if (useIndex) {
                                // Fecha ficticia basada en índice si no hay fecha real
                                dataPoint.date = new Date(2000, 0, 1, 0, 0, i).getTime(); 
                            } else if (dates[i]) {
                                dataPoint.date = new Date(dates[i]).getTime();
                            }

                            if (dataPoint.date) {
                                chartData.push(dataPoint);
                            }
                        }
                    }

                    // Si después de procesar no hay datos, salir
                    if (chartData.length < 2) return;

                    // 2. Configurar Gráfica
                    var root = am5.Root.new("speedLineChartDiv");
                    
                    // IMPORTANTE: NO USAR themes_Animated para PDF. 
                    // Esto asegura que la gráfica esté lista inmediatamente.

                    var chart = root.container.children.push(am5xy.XYChart.new(root, {
                        panX: false, panY: false, wheelX: "none", wheelY: "none",
                        layout: root.verticalLayout
                    }));

                    // 3. Ejes
                    var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
                        maxDeviation: 0.1,
                        baseInterval: { timeUnit: "second", count: 1 },
                        renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 50 }),
                        tooltip: am5.Tooltip.new(root, {})
                    }));

                    // Formato de fechas en eje X
                    xAxis.get("dateFormats")["hour"] = "HH:mm";
                    xAxis.get("dateFormats")["minute"] = "HH:mm";
                    xAxis.get("dateFormats")["second"] = "HH:mm:ss";

                    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
                        renderer: am5xy.AxisRendererY.new(root, {}),
                        min: 0
                    }));
                    
                    yAxis.children.unshift(am5.Label.new(root, { 
                        rotation: -90, text: "Velocidad (km/h)", y: am5.p50, centerX: am5.p50 
                    }));

                    // 4. Serie de Línea
                    var series = chart.series.push(am5xy.LineSeries.new(root, {
                        name: "Velocidad",
                        xAxis: xAxis,
                        yAxis: yAxis,
                        valueYField: "value",
                        valueXField: "date"
                    }));

                    series.strokes.template.setAll({ strokeWidth: 2, stroke: am5.color(0x${color.replace('#', '')}) });
                    series.fills.template.setAll({ fillOpacity: 0.2, visible: true, fill: am5.color(0x${color.replace('#', '')}) });

                    // 5. Cargar datos SIN ANIMACIÓN (Clave para que salga en el PDF)
                    series.data.setAll(chartData);
                    series.appear(0); 
                    chart.appear(0, 0);
                });
            </script>
        `;
    };

    const generateSpeedChartSection = () => {
        if (!chart || !route) return '';
        const hasSpeeds = device.speeds && device.speeds.length > 0;

        return `
            <h3 class="font-bold my-2 text-[15px]">Distribución de Velocidad:</h3>
            ${hasSpeeds
                ? '<div id="speedChartDiv" class="w-full h-[200px]"></div>'
                : '<p class="text-[13px] h-[150px] flex items-center justify-center bg-gray-100 rounded">No hay datos de velocidad disponibles</p>'
            }
        `;
    };

    const generateSpeedChartScript = () => {
        if (!chart || !route || !device.speeds || device.speeds.length === 0) return '';

        return `
            <script>
                am5.ready(function() {
                    var root = am5.Root.new("speedChartDiv");
                    root.setThemes([ am5themes_Animated.new(root) ]);

                    var chart = root.container.children.push(am5xy.XYChart.new(root, {
                        panX: false,
                        panY: false,
                        wheelX: "none",
                        wheelY: "none",
                        layout: root.verticalLayout
                    }));

                    // --- Procesamiento de Datos de Velocidad ---
                    var speeds = ${JSON.stringify(device.speeds)};
                    
                    // Definir rangos (puedes ajustar los límites aquí)
                    var ranges = {
                        "0 km/h (Detenido)": 0,
                        "1-40 km/h (Urbano)": 0,
                        "41-80 km/h (Avenida)": 0,
                        "81-110 km/h (Carretera)": 0,
                        "> 110 km/h (Exceso)": 0
                    };

                    // Clasificar velocidades
                    speeds.forEach(function(s) {
                        if (s <= 0) ranges["0 km/h (Detenido)"]++;
                        else if (s <= 40) ranges["1-40 km/h (Urbano)"]++;
                        else if (s <= 80) ranges["41-80 km/h (Avenida)"]++;
                        else if (s <= 110) ranges["81-110 km/h (Carretera)"]++;
                        else ranges["> 110 km/h (Exceso)"]++;
                    });

                    // Convertir a formato array para amCharts
                    var data = Object.keys(ranges).map(function(key) {
                        return { category: key, value: ranges[key] };
                    });

                    // --- Ejes ---
                    var xRenderer = am5xy.AxisRendererX.new(root, { 
                        minGridDistance: 30,
                        cellStartLocation: 0.1,
                        cellEndLocation: 0.9
                    });
                    
                    xRenderer.labels.template.setAll({
                        fontSize: 10,
                        rotation: -15, // Ligera rotación si los textos son largos
                        centerY: am5.percent(50),
                        centerX: am5.percent(50)
                    });

                    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
                        categoryField: "category",
                        renderer: xRenderer,
                        tooltip: am5.Tooltip.new(root, {})
                    }));

                    xAxis.data.setAll(data);

                    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
                        renderer: am5xy.AxisRendererY.new(root, {}),
                        min: 0
                    }));

                    // --- Serie ---
                    var series = chart.series.push(am5xy.ColumnSeries.new(root, {
                        name: "Frecuencia",
                        xAxis: xAxis,
                        yAxis: yAxis,
                        valueYField: "value",
                        categoryXField: "category",
                        tooltip: am5.Tooltip.new(root, {
                            labelText: "{valueY} registros"
                        })
                    }));

                    // Colores condicionales según el rango
                    series.columns.template.adapters.add("fill", function(fill, target) {
                        if (target.dataItem) {
                            var category = target.dataItem.get("categoryX");
                            if (category.includes("Detenido")) return am5.color(0x999999); // Gris
                            if (category.includes("Exceso")) return am5.color(0xFF0000); // Rojo
                            if (category.includes("Carretera")) return am5.color(0xFFA500); // Naranja
                            return am5.color(0x${color.replace('#', '')}); // Color del tema para el resto
                        }
                        return fill;
                    });

                    series.columns.template.setAll({
                        cornerRadiusTL: 5,
                        cornerRadiusTR: 5,
                        strokeOpacity: 0
                    });

                    // Etiqueta con valor arriba de la barra
                    series.bullets.push(function () {
                        return am5.Bullet.new(root, {
                            locationY: 1,
                            sprite: am5.Label.new(root, {
                                text: "{valueY}",
                                fill: root.interfaceColors.get("alternativeText"),
                                centerY: 0,
                                centerX: am5.percent(50),
                                populateText: true,
                                fontSize: 11
                            })
                        });
                    });

                    series.data.setAll(data);
                    series.appear(1000);
                    chart.appear(1000, 100);
                });
            </script>
        `;
    };

    const generateHourlyChartSection = () => {
        if (!chart) return '';
        const hasRawAlerts = device.rawAlerts && device.rawAlerts.length > 0;

        if (!hasRawAlerts) return '';

        return `
            <div class="h-10"></div>
            <h3 class="font-bold my-2 text-[15px]">Frecuencia de Alertas por Hora:</h3>
            <div id="hourlyChartDiv" class="w-full h-[200px]"></div>
        `;
    };

    const generateAlertsSection = () => {
        if (!includeAlerts) return '';
        return `
            <h3 class="font-bold mb-4 mt-16 text-[15px]">Listado De Alertas:</h3>
            <table class="text-[13px]">
                ${device.alerts.filter(alert => ![
            'Persona peligrosidad baja con faltas administrativas',
            'Persona peligrosidad media',
            'Persona peligrosidad alta',
            'Reconocimiento de placa',
            'Personal reconocido',
            'Persona no reconocida',
            'Fin del recorrido',
            'Alerta de geo-cercado',
            'Advertencia de colisión de peatones',
            'Alerta de cambios anormales de temperatura',
            'Persona VIP',
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
            <h3 class="font-bold mt-6 mb-4 text-[15px] text-[${color}]">Resumen de Combustible</h3> 
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: ${color}; color: white;">
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border: 1px solid ${color};">Parametros</th>
                            <th style="padding: 12px 15px; text-align: center; font-weight: 600; border: 1px solid ${color};">Valor</th>
                            <th style="padding: 12px 15px; text-align: center; font-weight: 600; border: 1px solid ${color};">Unidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background: white;">
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 500;">Distancia Recorrida</td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center; font-weight: 600; color: ${color};">
                                ${safeValue(device.summary.kilometers_traveled)}
                            </td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center;">km</td>
                        </tr>
                        <tr style="background: #f8f9fa;">
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 500;">Rendimiento</td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center; font-weight: 600; color: ${color};">
                                ${safeValue(device.summary.km_per_liter)}
                            </td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center;">km/litro</td>
                        </tr>
                        <tr style="background: white;">
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 500;">Combustible Gastado</td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center; font-weight: 600; color: ${color};">
                                ${safeValue(device.summary.spent_gas)}
                            </td>
                            <td style="padding: 12px 15px; border: 1px solid #dee2e6; text-align: center;">Litros</td>
                        </tr>
                    </tbody>
                </table>
        `;
    };

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

    const generateChartScript = () => {
        if (!chart || device.alerts.length === 0) return '';
        return `
            <script>
                am5.ready(function() {
                    var root = am5.Root.new("chartdiv");
                    
                    root.setThemes([ am5themes_Animated.new(root) ]);

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

    const generateHourlyChartScript = () => {
        if (!chart || !device.rawAlerts || device.rawAlerts.length === 0) return '';

        return `
            <script>
                am5.ready(function() {
                    var root = am5.Root.new("hourlyChartDiv");

                    // Temas
                    root.setThemes([ am5themes_Animated.new(root) ]);

                    var chart = root.container.children.push(am5xy.XYChart.new(root, {
                        panX: false,
                        panY: false,
                        wheelX: "none",
                        wheelY: "none",
                        layout: root.verticalLayout
                    }));

                    // --- Procesar datos crudos ---
                    var rawAlerts = ${JSON.stringify(device.rawAlerts)};
                    var hourlyCounts = {};
                    
                    // Inicializar las 24 horas en 0
                    for(var i=0; i<24; i++) {
                        hourlyCounts[i] = 0;
                    }

                    // Contar alertas por hora
                    rawAlerts.forEach(function(alert) {
                        var date = new Date(alert.date);
                        var hour = date.getHours();
                        if (!isNaN(hour)) {
                            hourlyCounts[hour]++;
                        }
                    });

                    // Formatear para amCharts
                    var data = [];
                    for(var i=0; i<24; i++) {
                        data.push({
                            hour: i.toString() + ":00", // Etiqueta eje X
                            value: hourlyCounts[i]      // Valor eje Y
                        });
                    }

                    // --- Eje X (Categorías - Horas) ---
                    var xRenderer = am5xy.AxisRendererX.new(root, { 
                        minGridDistance: 30,
                        cellStartLocation: 0.1,
                        cellEndLocation: 0.9
                    });

                    xRenderer.labels.template.setAll({
                        rotation: -45,
                        centerY: am5.percent(50),
                        centerX: am5.percent(100),
                        fontSize: 10
                    });

                    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
                        categoryField: "hour",
                        renderer: xRenderer,
                        tooltip: am5.Tooltip.new(root, {})
                    }));

                    xAxis.data.setAll(data);

                    // --- Eje Y (Valores) ---
                    var yRenderer = am5xy.AxisRendererY.new(root, {});
                    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
                        renderer: yRenderer,
                        min: 0,
                        maxPrecision: 0 // Solo enteros
                    }));

                    // --- Serie de Columnas ---
                    var series = chart.series.push(am5xy.ColumnSeries.new(root, {
                        name: "Alertas",
                        xAxis: xAxis,
                        yAxis: yAxis,
                        valueYField: "value",
                        categoryXField: "hour",
                        tooltip: am5.Tooltip.new(root, {
                            labelText: "{valueY}"
                        })
                    }));

                    // Estilo de columnas (Usando el color principal del reporte)
                    series.columns.template.setAll({
                        tooltipY: 0,
                        strokeOpacity: 0,
                        cornerRadiusTL: 4,
                        cornerRadiusTR: 4,
                        fill: am5.color(0x${color.replace('#', '')}) 
                    });

                    // Etiquetas sobre las barras
                    series.bullets.push(function () {
                        return am5.Bullet.new(root, {
                            locationY: 1,
                            sprite: am5.Label.new(root, {
                                text: "{valueY}",
                                fill: root.interfaceColors.get("alternativeText"),
                                centerY: 0,
                                centerX: am5.percent(50),
                                populateText: true,
                                fontSize: 10
                            })
                        });
                    });

                    series.data.setAll(data);
                    
                    // Animación
                    series.appear(1000);
                    chart.appear(1000, 100);
                });
            </script>
        `;
    };

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
            }
            #hourlyChartDiv {
                width: 100%;
                height: 275px; 
                margin-bottom: 20px;
            }
            #speedChartDiv {
                width: 100%;
                height: 275px;
                margin-bottom: 20px;
            }
            #speedLineChartDiv {
                width: 100%;
                height: 350px;
                margin-bottom: 20px;
            }`;
        }

        return { leafletCSS, mapStyles, chartStyles };
    };

    const { leafletCSS, mapStyles, chartStyles } = getRequiredStyles();

    const CONTENT = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reporte Vehicular</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${leafletCSS}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            * {
                margin: 0;
                padding: 0;
                font-family: Arial, Helvetica, sans-serif;
            }
            
            body {
                background-image: url(${isLetterhead ? 'https://res.cloudinary.com/dfvro9k4k/image/upload/v1757617598/okip_uma4qs.png' : ''});
                background-size: 100% auto;
                background-position: top center;
                background-repeat: repeat;
                background-attachment: scroll;
                height: auto;
                padding-bottom: 0;
                position: relative;
                margin: 0;
                padding: 0;
            }
            
            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: ${color};
                color: white;
                text-align: center;
                padding: 15px 0;
                font-size: 14px;
                font-weight: bold;
                z-index: 1000;
                letter-spacing: 0.5px;
            }
            
            ${mapStyles}
            ${chartStyles}
        </style>
    </head>
    <body>
        <div class="content-wrapper">
            <div class="flex flex-col my-[15px] mx-[68px]">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex flex-col gap-0">
                        <span class="text-[14px] font-bold underline">INFORME GENERAL</span>
                        <span class="text-[11px]">Los parámetros utilizados para el presente informe corresponden del</span>
                        <span class="text-[11px]"><u>${moment(from).utcOffset(0).format('D [de] MMMM [del] YYYY, HH:mm:ss')}</u> al <u>${moment(to).utcOffset(0).format('D [de] MMMM [del] YYYY, HH:mm:ss')}</u></span>
                    </div>
                    <div>
                        <img src="${icon}" width="40" height="40">
                    </div>
                </div>
                <div class="bg-[${color}] py-[2px] mb-2"></div>

                <h3 class="font-bold mb-2 text-[15px]">Reporte De Unidad: <u>${device.summary.name}</u></h3>
                
                ${generateRouteSection()}
                ${generateChartSection()}
                ${generateHourlyChartSection()}
                ${generateSpeedChartSection()}
                ${generateSpeedLineChartSection()}
                ${generateAlertsSection()}
                ${generateSummarySection()}
            </div>
        </div>

        <div class="footer">
            OKIP "Inteligencia Mexicana al Servicio de la Nación"
        </div>

        ${route ? '<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>' : ''}
        
        ${(chart && (device.alerts.length > 0 || (device.speeds && device.speeds.length > 0))) ? `
            <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
            <script src="https://cdn.amcharts.com/lib/5/percent.js"></script>
            <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
            <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script> 
        ` : ''}
        
        ${generateMapScript()}
        ${generateChartScript()}
        ${generateHourlyChartScript()}
        ${generateSpeedChartScript()}
        ${generateSpeedLineChartScript()} </body>
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

export const generateGeneralReport = async (devicesData, groupId, groupName, deviceNames, realFrom, realTo, authorization, icon, color, isLetterhead, deviceDependencies, dependencies) => {
    moment.locale('es')
    try {
        const dependenciesMap = await analyzeDependencies(deviceNames, devicesData, groupId, groupName, deviceDependencies, dependencies);
        const reportData = await buildReportStructureFromService(dependenciesMap, devicesData);
        const pdf = await generateGeneralPDF(reportData, groupName, realFrom, realTo, icon, color, isLetterhead);
        return pdf;
    } catch (error) {
        console.error('Error in generateGeneralReport:', error);
        throw new Error(`Error generating general report: ${error.message}`);
    }
};

const analyzeDependencies = async (deviceNames, devicesData, groupId, groupName, deviceDependencies, dependencies) => {
    const dependenciesMap = {};
    const dependencyMap = {};
    dependencies.forEach(dep => {
        dependencyMap[dep.id] = dep.dependency;
    });

    deviceNames.forEach((name, index) => {
        const deviceData = devicesData[index];
        const deviceDep = deviceDependencies.find(d => d.deviceId === deviceData.deviceId);
        let dependencyName = groupName;
        if (deviceDep && deviceDep.dependencyId) {
            dependencyName = dependencyMap[deviceDep.dependencyId] || groupName;
        }

        const typeLabel = deviceDep?.vehicleType || 'Vehiculo';

        if (!dependenciesMap[dependencyName]) {
            dependenciesMap[dependencyName] = {
                Motos: [],
                Vehiculo: []
            };
        }

        dependenciesMap[dependencyName][typeLabel].push({
            name,
            deviceId: deviceData.deviceId,
            deviceData
        });
    });

    return dependenciesMap;
};

const buildReportStructureFromService = async (dependenciesMap, devicesData) => {
    const reportStructure = [];
    const fixedAlertIds = [60, 62, 63, 64, 160, 169, 5, 69, 70];
    const globalAlertTotals = {};
    fixedAlertIds.forEach(id => {
        globalAlertTotals[id] = {
            id: id,
            category: `Alerta ${id}`,
            total: 0
        };
    });

    devicesData.forEach(device => {
        if (device.alerts && device.alerts.length > 0) {
            device.alerts.forEach(alert => {
                if (fixedAlertIds.includes(alert.id)) {
                    if (!globalAlertTotals[alert.id]) {
                        globalAlertTotals[alert.id] = {
                            id: alert.id,
                            category: alert.category || `Alerta ${alert.id}`,
                            total: 0
                        };
                    }
                    globalAlertTotals[alert.id].total += alert.value || 0;
                    globalAlertTotals[alert.id].category = alert.category || `Alerta ${alert.id}`;
                }
            });
        }
    });

    const updatedFixedAlerts = fixedAlertIds.map(id => ({
        id: id,
        category: globalAlertTotals[id]?.category || `Alerta ${id}`,
        total: globalAlertTotals[id]?.total || 0
    }));

    Object.entries(dependenciesMap).forEach(([dependencyName, types]) => {
        const dependencyData = {
            name: dependencyName,
            types: []
        };

        ['Motos', 'Vehiculo'].forEach(typeLabel => {
            if (types[typeLabel] && types[typeLabel].length > 0) {
                const devices = types[typeLabel];
                const total = devices.length;
                let withMovement = 0;
                let withoutMovement = 0;
                let totalKm = 0;
                let alertTotals = {};
                let grandTotalAlerts = 0;

                fixedAlertIds.forEach(id => {
                    alertTotals[id] = 0;
                });

                devices.forEach(device => {
                    const deviceServiceData = devicesData.find(d => d.deviceId === device.deviceId);

                    if (deviceServiceData?.hasMovement) {
                        withMovement++;
                        totalKm += deviceServiceData.mileage || 0;

                        if (typeLabel === 'Vehiculo' && deviceServiceData.alerts) {
                            deviceServiceData.alerts.forEach(alert => {
                                if (alertTotals.hasOwnProperty(alert.id)) {
                                    alertTotals[alert.id] += alert.value || 0;
                                }
                                if (fixedAlertIds.includes(alert.id)) {
                                    grandTotalAlerts += alert.value || 0;
                                }
                            });
                        }
                    } else {
                        withoutMovement++;
                    }
                });

                dependencyData.types.push({
                    type: typeLabel,
                    total,
                    withMovement,
                    withoutMovement,
                    totalKm: totalKm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    alerts: alertTotals,
                    totalAlerts: grandTotalAlerts,
                    fixedAlertsInfo: updatedFixedAlerts
                });
            }
        });

        if (dependencyData.types.length > 0) {
            reportStructure.push(dependencyData);
        }
    });

    reportStructure.fixedAlerts = updatedFixedAlerts;

    return reportStructure;
};

const generateGeneralPDF = async (reportData, groupName, realFrom, realTo, icon, color, isLetterhead, deviceDependencies) => {
    const htmlPDF = new PuppeteerHTMLPDF();
    const options = {
        format: 'A4',
        printBackground: true,
        landscape: false
    };

    htmlPDF.setOptions(options);

    const fixedAlerts = reportData.fixedAlerts || [];
    const calculateGeneralTotals = () => {
        let totalVehicles = 0;
        let totalWithMovement = 0;
        let totalWithoutMovement = 0;
        let totalKm = 0;
        let totalAlertsArray = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        let grandTotalAlerts = 0;

        reportData.forEach(dependency => {
            dependency.types.forEach(typeData => {
                totalVehicles += typeData.total;
                totalWithMovement += typeData.withMovement;
                totalWithoutMovement += typeData.withoutMovement;
                totalKm += parseFloat(typeData.totalKm.replace(/,/g, ''));
                grandTotalAlerts += typeData.totalAlerts;

                for (let i = 0; i < 9; i++) {
                    if (i < fixedAlerts.length) {
                        const alert = fixedAlerts[i];
                        totalAlertsArray[i] += typeData.alerts[alert.id] || 0;
                    }
                }
            });
        });

        return {
            totalVehicles,
            totalWithMovement,
            totalWithoutMovement,
            totalKm: totalKm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalAlertsArray,
            grandTotalAlerts
        };
    };

    const totals = calculateGeneralTotals();

    const generateTableRows = () => {
        return reportData.map(dependency => {
            return dependency.types.map((typeData, index) => {
                const isFirstRow = index === 0;
                const rowspanAttr = dependency.types.length > 1 && isFirstRow ? `rowspan="${dependency.types.length}"` : '';

                const alertColumns = [];
                for (let i = 0; i < 9; i++) {
                    if (i < fixedAlerts.length) {
                        const alert = fixedAlerts[i];
                        const alertValue = typeData.alerts[alert.id] || 0;
                        alertColumns.push(`<td class="center">${alertValue}</td>`);
                    } else {
                        alertColumns.push(`<td class="center">0</td>`);
                    }
                }

                return `
                    <tr>
                        ${isFirstRow ? `<td ${rowspanAttr} class="dependency-cell">${dependency.name}</td>` : ''}
                        <td>${typeData.type}</td>
                        <td class="center">${typeData.total}</td>
                        <td class="center">${typeData.withMovement}</td>
                        <td class="center">${typeData.withoutMovement}</td>
                        <td class="center">${typeData.totalKm}</td>
                        ${alertColumns.join('')}
                        <td class="center">${typeData.totalAlerts}</td>
                    </tr>
                `;
            }).join('');
        }).join('');
    };

    const generateTotalsRow = () => {
        const alertColumns = [];
        for (let i = 0; i < 9; i++) {
            alertColumns.push(`<td class="center totals-row">${totals.totalAlertsArray[i]}</td>`);
        }

        return `
            <tr class="totals-row-bg">
                <td class="center totals-row" colspan="2"><strong>TOTALES</strong></td>
                <td class="center totals-row"><strong>${totals.totalVehicles}</strong></td>
                <td class="center totals-row"><strong>${totals.totalWithMovement}</strong></td>
                <td class="center totals-row"><strong>${totals.totalWithoutMovement}</strong></td>
                <td class="center totals-row"><strong>${totals.totalKm}</strong></td>
                ${alertColumns.join('')}
                <td class="center totals-row"><strong>${totals.grandTotalAlerts}</strong></td>
            </tr>
        `;
    };

    const CONTENT = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reporte General Vehicular</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                font-family: Arial, Helvetica, sans-serif;
            }
            
            body {
                background-image: url(${isLetterhead ? 'https://res.cloudinary.com/dfvro9k4k/image/upload/v1757617598/okip_uma4qs.png' : ''});
                background-size: 100% auto;
                background-position: top center;
                background-repeat: repeat;
                background-attachment: scroll;
                height: auto;
                padding-bottom: 0;
                position: relative;
                margin: 0;
                padding: 0;
            }
            
            .content-wrapper {
                background-color: rgba(255, 255, 255, 0.1);
                min-height: calc(100vh - 80px);
                padding: 15px 20px;
                position: relative;
                z-index: 1;
            }
            
            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: ${color};
                color: white;
                text-align: center;
                padding: 10px 0;
                font-size: 14px;
                font-weight: bold;
                z-index: 1000;
                letter-spacing: 0.5px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .header-left {
                text-align: left;
            }

            .header-right img {
                display: block;
            }

            .header span {
                display: block;
            }
            
            .title {
                font-size: 14px;
                font-weight: bold;
                text-decoration: underline;
                margin-bottom: 5px;
            }
            
            .subtitle {
                font-size: 11px;
                font-weight: bold;
                margin-bottom: 2px;
            }
            
            .date-info {
                font-size: 11px;
                margin-bottom: 2px;
            }
            
            .separator {
                background-color: ${color};
                height: 2px;
                margin: 10px 0 20px 0;
            }
            
            .report-title {
                font-size: 15px;
                font-weight: bold;
                margin-bottom: 15px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
                margin-top: 10px;
                background-color: white;
            }
            
            th {
                background-color: ${color};
                color: white;
                padding: 6px 3px;
                text-align: center;
                font-weight: bold;
                border: 1px solid ${color};
            }
            
            td {
                padding: 4px 3px;
                border: 1px solid #ddd;
                vertical-align: middle;
                background-color: white;
            }
            
            .center {
                text-align: center;
            }
            
            .dependency-cell {
                background-color: #f8f9fa;
                font-weight: 600;
                text-align: center;
                vertical-align: middle;
            }
            
            tr:nth-child(even) td {
                background-color: #f9f9f9;
            }
            
            tr:nth-child(odd) td {
                background-color: white;
            }
            
            /* Estilos para la fila de totales */
            .totals-row-bg {
                background-color: #f8f9fa !important;
                border-bottom: 2px solid #dee2e6 !important;
            }
            
            .totals-row {
                background-color: #f8f9fa !important;
                color: ${color} !important;
                font-weight: bold !important;
                border: 1px solid #dee2e6 !important;
                font-size: 11px !important;
                padding: 8px 3px !important;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .legend {
                margin-top: 20px;
                font-size: 10px;
                page-break-inside: avoid;
                padding: 15px;
                border-radius: 5px;
            }
            
            .legend h4 {
                margin-bottom: 10px;
                font-size: 12px;
                color: ${color};
            }
            
            .legend p {
                margin: 2px 0;
                line-height: 1.4;
            }
        </style>
    </head>
    <body>
        <div class="content-wrapper">
            <div class="header">
                <div class="header-left">
                    <span class="title">REPORTE GENERAL VEHICULAR</span>
                    <span class="date-info">Los parámetros utilizados para el presente informe corresponden del</span>
                    <span class="date-info">
                        <u>${moment(realFrom).utcOffset(0).format('D [de] MMMM [del] YYYY, HH:mm:ss')}</u> al 
                        <u>${moment(realTo).utcOffset(0).format('D [de] MMMM [del] YYYY, HH:mm:ss')}</u>
                    </span>
                </div>
            <div class="header-right">
                <img src="${icon}" width="40" height="40">
            </div>
        </div>
            
            <div class="separator"></div>
            
            <h3 class="report-title">Reporte De Grupo: <u>${groupName}</u></h3>
            
            <table>
                <thead>
                    <tr>
                        <th rowspan="2">Dependencia</th>
                        <th rowspan="2">Vehículo</th>
                        <th rowspan="2">Total</th>
                        <th rowspan="2">Con movimiento</th>
                        <th rowspan="2">Sin movimiento</th>
                        <th rowspan="2">KM<br>Totales</th>
                        <th colspan="10">Alertas</th>
                    </tr>
                    <tr>
                        <th>1</th>
                        <th>2</th>
                        <th>3</th>
                        <th>4</th>
                        <th>5</th>
                        <th>6</th>
                        <th>7</th>
                        <th>8</th>
                        <th>9</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateTableRows()}
                    ${generateTotalsRow()}
                </tbody>
            </table>
            
            ${fixedAlerts.length > 0 ? `
            <div class="legend">
                <h4>Leyenda de Alertas:</h4>
                ${fixedAlerts.map((alert, index) =>
        `<p><strong>${index + 1}.</strong> ${alert.category} (ID: ${alert.id}, Total: ${alert.total})</p>`
    ).join('')}
            </div>
            ` : ''}
        </div>

        <div class="footer">
            OKIP "Inteligencia Mexicana al Servicio de la Nación"
        </div>
    </body>
    </html>
    `;

    const PDF = await htmlPDF.create(CONTENT);
    return PDF;
};

export const radioPdfGenerator = async (radio, from, to, isSatelite, reportSections = {}, icon, color, isLetterhead) => {
    moment.locale('es')
    const htmlPDF = new PuppeteerHTMLPDF()
    const options = {
        format: 'A4',
        printBackground: true
    }

    htmlPDF.setOptions(options)

    const {
        route = true,
        tableOfContents = true
    } = reportSections;

    const generateRouteSection = () => {
        if (!route) return '';
        const hasCoordinates = radio.coordinates && radio.coordinates.length > 0;

        return `
        <h3 class="font-bold mb-2 text-[15px]">Ruta Recorrida:</h3>
        <div id="map" class="relative h-[400px] rounded-2xl overflow-hidden bg-gray-200">
            ${!hasCoordinates
                ? `<div class="absolute inset-0 flex items-center justify-center bg-gray-200 text-red-600 text-2xl font-bold">
                      Sin Movimiento Registrado
                   </div>`
                : ''
            }
        </div>
    `;
    };

    const generateTableOfContentsSection = () => {
        if (!tableOfContents) return '';

        const formatStatus = (status) => status ? 'Activo' : 'Inactivo';
        const formatOnline = (online) => online ? 'En línea' : 'Desconectado';
        const formatDate = (date) => {
            if (!date) return 'N/A';
            return moment(date).format('DD/MM/YYYY HH:mm:ss');
        };

        return `
            <h3 class="font-bold my-2 text-[15px]">Información del Radio:</h3>
            ${radio.radioInfo ? `
                <table class="w-full text-[12px] my-4" style="border-collapse: collapse;">
                    <thead>
                        <tr style="background: ${color}; color: white;">
                            <th style="padding: 10px; text-align: left; border: 1px solid ${color}; font-weight: bold;">Parámetro</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid ${color}; font-weight: bold;">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 8px 10px; border: 1px solid #ddd; font-weight: 600;">ID del Radio</td>
                            <td style="padding: 8px 10px; border: 1px solid #ddd;">${radio.radioInfo.id}</td>
                        </tr>
                        <tr style="background: white;">
                            <td style="padding: 8px 10px; border: 1px solid #ddd; font-weight: 600;">Nombre</td>
                            <td style="padding: 8px 10px; border: 1px solid #ddd;">${radio.radioInfo.name || 'N/A'}</td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 8px 10px; border: 1px solid #ddd; font-weight: 600;">Modelo</td>
                            <td style="padding: 8px 10px; border: 1px solid #ddd;">${radio.radioInfo.model}</td>
                        </tr>
                        <tr style="background: white;">
                            <td style="padding: 8px 10px; border: 1px solid #ddd; font-weight: 600;">Estado</td>
                            <td style="padding: 8px 10px; border: 1px solid #ddd;">
                                <span style="color: ${radio.radioInfo.status ? '#28a745' : '#dc3545'}; font-weight: 600;">
                                    ${formatStatus(radio.radioInfo.status)}
                                </span>
                            </td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 8px 10px; border: 1px solid #ddd; font-weight: 600;">Conexión</td>
                            <td style="padding: 8px 10px; border: 1px solid #ddd;">
                                <span style="color: ${radio.radioInfo.online ? '#28a745' : '#dc3545'}; font-weight: 600;">
                                    ${formatOnline(radio.radioInfo.online)}
                                </span>
                            </td>
                        </tr>
                        <tr style="background: white;">
                            <td style="padding: 8px 10px; border: 1px solid #ddd; font-weight: 600;">Tipo</td>
                            <td style="padding: 8px 10px; border: 1px solid #ddd;">${radio.radioInfo.type}</td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 8px 10px; border: 1px solid #ddd; font-weight: 600;">Última Actualización</td>
                            <td style="padding: 8px 10px; border: 1px solid #ddd;">${formatDate(radio.radioInfo.lastUpdate)}</td>
                        </tr>
                    </tbody>
                </table>
            ` : '<p class="text-2xl h-[200px] flex items-center justify-center">No se encontró información del radio</p>'}
        `;
    };

    const generateMapScript = () => {
        if (!route || !radio.coordinates || radio.coordinates.length === 0) return '';

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

            var coordinates = ${JSON.stringify(radio.coordinates)};
            if (coordinates.length > 1) {
                var polyline = L.polyline(coordinates, { color: 'red', weight: 3 }).addTo(map);
                var bounds = polyline.getBounds();
                map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
                
                // Agregar marcadores de inicio y fin
                if (coordinates.length > 0) {
                    L.marker(coordinates[0], {
                        icon: L.divIcon({
                            className: 'custom-marker',
                            html: '<div style="background: green; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                            iconSize: [16, 16],
                            iconAnchor: [8, 8]
                        })
                    }).addTo(map).bindPopup('Inicio');
                    
                    L.marker(coordinates[coordinates.length - 1], {
                        icon: L.divIcon({
                            className: 'custom-marker',
                            html: '<div style="background: red; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                            iconSize: [16, 16],
                            iconAnchor: [8, 8]
                        })
                    }).addTo(map).bindPopup('Fin');
                }
            } else if (coordinates.length === 1) {
                var marker = L.marker(coordinates[0], {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: '<div style="background: blue; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    })
                }).addTo(map).bindPopup('Posición');
                map.setView(coordinates[0], 14);
            }
        </script>
    `;
    };

    const getRequiredStyles = () => {
        let leafletCSS = '';
        let mapStyles = '';

        if (route) {
            leafletCSS = '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />';
            mapStyles = `
            #map {
                height: 400px;
                border-radius: 20px;
                overflow: hidden;
            }`;
        }

        return { leafletCSS, mapStyles };
    };

    const { leafletCSS, mapStyles } = getRequiredStyles();

    const CONTENT = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reporte de Radio</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${leafletCSS}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            * {
                margin: 0;
                padding: 0;
                font-family: Arial, Helvetica, sans-serif;
            }
            
            body {
                background-image: url(${isLetterhead ? 'https://res.cloudinary.com/dfvro9k4k/image/upload/v1757617598/okip_uma4qs.png' : ''});
                background-size: 100% auto;
                background-position: top center;
                background-repeat: repeat;
                background-attachment: scroll;
                height: auto;
                padding-bottom: 0;
                position: relative;
                margin: 0;
                padding: 0;
            }
            
            
            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: ${color};
                color: white;
                text-align: center;
                padding: 15px 0;
                font-size: 14px;
                font-weight: bold;
                z-index: 1000;
                letter-spacing: 0.5px;
            }
            
            ${mapStyles}
            
            table {
                border-collapse: collapse;
                width: 100%;
                margin-top: 10px;
                background-color: white;
            }
            
            th, td {
                text-align: left;
                border: 1px solid #ddd;
                background-color: white;
            }
            
            th {
                background-color: ${color};
                color: white;
                font-weight: bold;
            }
            
            tr:nth-child(even) td {
                background-color: #f9f9f9;
            }
            
            tr:nth-child(odd) td {
                background-color: white;
            }
        </style>
    </head>
    <body>
        <div class="content-wrapper">
            <div class="flex flex-col my-[15px] mx-[68px]">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex flex-col gap-0">
                        <span class="text-[14px] font-bold underline">INFORME DE RADIO</span>
                        <span class="text-[11px]">Los parámetros utilizados para el presente informe corresponden del</span>
                        <span class="text-[11px]"><u>${moment(from).utcOffset(0).format('D [de] MMMM [del] YYYY, HH:mm:ss')}</u> al <u>${moment(to).utcOffset(0).format('D [de] MMMM [del] YYYY, HH:mm:ss')}</u></span>
                    </div>
                    <div>
                        <img src="${icon}" width="40" height="40">
                    </div>
                </div>
                <div class="bg-[${color}] py-[2px] mb-2"></div>

                <h3 class="font-bold mb-2 text-[15px]">Reporte De Radio: <u>${radio.name}</u></h3>
                
                ${generateTableOfContentsSection()}
                ${generateRouteSection()}
            </div>
        </div>

        <div class="footer">
            OKIP "Inteligencia Mexicana al Servicio de la Nación"
        </div>

        ${route ? '<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>' : ''}
        
        ${generateMapScript()}
    </body>
    </html>
    `

    const PDF = await htmlPDF.create(CONTENT)
    return PDF
}