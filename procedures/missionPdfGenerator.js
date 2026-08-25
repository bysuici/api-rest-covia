import PuppeteerHTMLPDF from 'puppeteer-html-pdf'
import moment from 'moment'

export const missionPdfGenerator = async (mission, isSatelite, icon, color, isLetterhead) => {
    moment.locale('es');
    const htmlPDF = new PuppeteerHTMLPDF();
    const options = {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: '0', bottom: '0', left: '0', right: '0' }
    };
    htmlPDF.setOptions(options);

    const getUnitStatusText = (status) => {
        if (!status) return 'Desconocido';
        switch (status.toUpperCase()) {
            case 'ASSIGNED': return 'ASIGNADA';
            case 'ACCEPTED': return 'ACEPTADA';
            case 'REJECTED': return 'RECHAZADA';
            case 'ARRIVED': return 'EN LUGAR';
            case 'FINISHED': return 'FINALIZADA';
            default: return status;
        }
    };

    const getUnitDate = (u) => {
        let bestDate = null;
        if (mission.logs && Array.isArray(mission.logs)) {
            const statusMap = { 'ASSIGNED': 'ASSIGN', 'ACCEPTED': 'ACCEPTED', 'REJECTED': 'REJECTED', 'ARRIVED': 'ARRIVED', 'FINISHED': 'FINISHED' };
            const targetType = statusMap[u.status?.toUpperCase()] || u.status?.toUpperCase();
            
            const sortedLogs = [...mission.logs].sort((a, b) => new Date(b.date) - new Date(a.date));
            const matchingLog = sortedLogs.find(l => {
                if (l.type !== targetType) return false;
                let parsed = l.description;
                if (typeof parsed === 'string') {
                    try { parsed = JSON.parse(parsed); } catch(e) {}
                }
                if (parsed && typeof parsed === 'object') {
                    const logDeviceId = parsed.device_id || parsed.id_device || parsed.deviceId;
                    const unitId = u.id_device || u.device_id || u.id;
                    if (logDeviceId && unitId && String(logDeviceId) === String(unitId)) return true;
                }
                return true; // fallback if no explicit device match
            });
            
            if (matchingLog) bestDate = matchingLog.date || matchingLog.timestamp;
        }
        
        if (!bestDate) bestDate = u.updated_at || u.assigned_at;
        return bestDate ? moment(bestDate).format('DD/MM/YYYY HH:mm') : '-';
    };

    const unitsHtml = (mission.unitsWithRoutes || []).map(u => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 500;">${u.alias || u.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${getUnitStatusText(u.status)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${getUnitDate(u)}</td>
        </tr>
    `).join('') || '<tr><td colspan="3" style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: center; color: #6b7280;">Sin unidades asignadas</td></tr>';

    const formatLogDescription = (desc) => {
        let parsed = desc;
        if (typeof desc === 'string') {
            try {
                parsed = JSON.parse(desc);
            } catch (e) {
                return desc || '-';
            }
        }
        if (typeof parsed !== 'object' || parsed === null) {
            return String(desc || '-');
        }
        let text = parsed.action || parsed.state || parsed.message || '-';
        if (parsed.officer) {
            text += ` - Oficial: ${parsed.officer}`;
        }
        return text;
    };


    const getLogTypeInfo = (type) => {
        switch (type) {
            case 'CREATED': return { text: 'CREADA', color: '#3b82f6' };
            case 'ALERT_RECEIVED': return { text: 'ALERTA RECIBIDA', color: '#f0d909ff' };
            case 'ACCEPTED': return { text: 'ACEPTADA', color: '#10b981' };
            case 'REJECTED': return { text: 'RECHAZADA', color: '#8b0000' };
            case 'ARRIVED': return { text: 'EN LUGAR', color: '#f96d16ff' };
            case 'FINISHED': return { text: 'FINALIZADA', color: '#000000' };
            case 'ASSIGN': return { text: 'ASIGNADO', color: '#06b6d4' };
            default: return { text: type, color: '#6b7280' };
        }
    };

    const logsHtml = (mission.logs || []).map(log => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #4b5563;">${moment(log.date).format('DD/MM/YYYY HH:mm:ss')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: bold; color: #1f2937;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${getLogTypeInfo(log.type).color};"></span>
                    <span>${getLogTypeInfo(log.type).text}</span>
                </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #4b5563;">${formatLogDescription(log.description)}</td>
        </tr>
    `).join('') || '<tr><td colspan="3" style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: center; color: #6b7280;">Sin registros en bitácora</td></tr>';

    const chatHtml = (mission.mensajes || mission.messages || []).map(msg => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #4b5563;">${moment(msg.timestamp).format('DD/MM/YYYY HH:mm:ss')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: bold; color: #1f2937;">${msg.senderName || msg.sender_name || 'Usuario'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #4b5563;">${msg.message || msg.text || '-'}</td>
        </tr>
    `).join('') || '<tr><td colspan="3" style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: center; color: #6b7280;">Sin mensajes de chat</td></tr>';

    // Parse relevant data safely
    let relData = null;
    try {
        relData = typeof mission.relevant_data === 'string' ? JSON.parse(mission.relevant_data) : mission.relevant_data;
    } catch (e) { }

    let finalizationHtml = '';
    if (mission.conclusion_status || mission.conclusion_notes || relData) {
        let relDataHtml = '';
        if (relData && Object.keys(relData).length > 0) {
            let items = [];
            if (relData.detenidos) items.push(`<span class="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm"><strong class="text-slate-900">Detenidos:</strong> ${relData.detenidos}</span>`);
            if (relData.heridos) items.push(`<span class="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm"><strong class="text-slate-900">Heridos:</strong> ${relData.heridos}</span>`);
            if (relData.vehiculos_asegurados) items.push(`<span class="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm"><strong class="text-slate-900">Vehículos asegurados:</strong> ${relData.vehiculos_asegurados}</span>`);
            if (relData.armas_aseguradas) items.push(`<span class="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm"><strong class="text-slate-900">Armas aseguradas:</strong> ${relData.armas_aseguradas.cantidad || 'Sí'} <span class="text-slate-500">(${relData.armas_aseguradas.tipo || 'N/A'})</span></span>`);
            if (relData.droga_asegurada) items.push(`<span class="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm"><strong class="text-slate-900">Droga asegurada:</strong> ${relData.droga_asegurada.cantidad || 'Sí'} <span class="text-slate-500">(${relData.droga_asegurada.tipo || 'N/A'})</span></span>`);
            if (relData.apoyo_extra) items.push(`<span class="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm"><strong class="text-slate-900">Apoyo extra:</strong> ${relData.apoyo_extra}</span>`);
            if (relData.faltas_civicas) items.push(`<span class="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm"><strong class="text-slate-900">Faltas Cívicas:</strong> ${relData.faltas_civicas}</span>`);
            if (relData.otros) items.push(`<span class="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm"><strong class="text-slate-900">${relData.otros.categoria || 'Otros'}:</strong> ${relData.otros.informacion || 'Sí'}</span>`);

            if (items.length === 0) items.push('<span class="text-xs text-slate-500 italic">Ningún dato relevante capturado.</span>');

            relDataHtml = `
                <div class="mt-4">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Datos Relevantes Reportados</span>
                    <div class="flex flex-wrap gap-2">
                        ${items.join('')}
                    </div>
                </div>
            `;
        }

        let notesHtml = '';
        if (mission.conclusion_notes) {
            notesHtml = `
                <div class="mt-4">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notas Finales del Operador</span>
                    <div class="text-sm font-medium text-slate-700 leading-relaxed bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        ${mission.conclusion_notes}
                    </div>
                </div>
            `;
        }

        finalizationHtml = `
            <h2 class="text-lg font-bold mt-8 mb-4 text-[#2563eb]">Finalización del Servicio</h2>
            <div class="rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-10 bg-slate-50 p-6 break-inside-avoid">
                <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                        <svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                        Detalles de Finalización
                    </h2>
                    ${mission.conclusion_status ? `
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado:</span>
                        <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                            ${mission.conclusion_status}
                        </span>
                    </div>` : ''}
                </div>
                ${relDataHtml}
                ${notesHtml}
            </div>
        `;
    }

    const generateMapScript = () => {
        let mapDataStr = JSON.stringify(mission.unitsWithRoutes || []);
        let logsDataStr = JSON.stringify(mission.logs || []);

        return `
        <script>
            const map = L.map('map', { zoomControl: false }).setView([${mission.latitud || 20.6766}, ${mission.longitud || -103.3475}], 14);
            L.tileLayer('${isSatelite ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}').addTo(map);
            
            const incidentIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41]
            });
            ${mission.latitud && mission.longitud ? 'L.marker([' + mission.latitud + ', ' + mission.longitud + '], {icon: incidentIcon}).addTo(map);' : ''}

            const data = ${mapDataStr};
            const logsData = ${logsDataStr};
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
            const bounds = L.latLngBounds();
            ${mission.latitud && mission.longitud ? 'bounds.extend([' + mission.latitud + ', ' + mission.longitud + ']);' : ''}

            data.forEach((u, i) => {
                if (u.route && u.route.length > 0) {
                    const latlngs = u.route.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);
                    L.polyline(latlngs, {color: colors[i % colors.length], weight: 4}).addTo(map);
                    latlngs.forEach(ll => bounds.extend(ll));
                }
            });

            const getEventColorHex = (type) => {
                switch(type) {
                    case 'CREATED': return '#3b82f6';
                    case 'ALERT_RECEIVED': return '#ffd91aff';
                    case 'ACCEPTED': return '#10b981';
                    case 'REJECTED': return '#8b0000';
                    case 'ARRIVED': return '#f97316';
                    case 'FINISHED': return '#000000';
                    case 'ASSIGN': return '#06b6d4';
                    default: return '#6b7280';
                }
            };

            logsData.forEach(log => {
                if (log.description && log.description.location && log.description.location.lat && log.description.location.lng) {
                    const color = getEventColorHex(log.type);
                    const marker = L.circleMarker([log.description.location.lat, log.description.location.lng], {
                        radius: 8,
                        fillColor: color,
                        color: 'white',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 1
                    }).addTo(map);
                    bounds.extend([log.description.location.lat, log.description.location.lng]);
                }
            });

            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [20, 20] });
            }

            map.on('load', function() {
                setTimeout(() => window.status = 'ready', 2000);
            });
            setTimeout(() => window.status = 'ready', 3000);
        </script>
        `;
    };

    const getPriorityColor = (p) => {
        if (!p) return 'text-green-600 border-green-200 bg-green-50';
        const pl = p.toLowerCase();
        if (pl === 'alta') return 'text-red-600 border-red-200 bg-red-50';
        if (pl === 'media') return 'text-orange-600 border-orange-200 bg-orange-50';
        return 'text-green-600 border-green-200 bg-green-50';
    };

    const prioClasses = getPriorityColor(mission.prioridad);

    const startDateStr = moment(mission.fecha_inicio).format('D [de] MMMM [del] YYYY, HH:mm:ss');
    let endDate = mission.fecha_inicio;
    if (mission.fecha_fin) {
        endDate = mission.fecha_fin;
    } else if (mission.logs && mission.logs.length > 0) {
        endDate = mission.logs[mission.logs.length - 1].date;
    }
    const endDateStr = moment(endDate).format('D [de] MMMM [del] YYYY, HH:mm:ss');

    const CONTENT = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { font-family: 'Inter', Arial, sans-serif; -webkit-print-color-adjust: exact; margin:0; padding:0; background-color: #f8fafc; }
            .page-break { page-break-before: always; }
        </style>
    </head>
    <body class="bg-[#f8fafc]">
        
        <!-- NEW HEADER -->
        <div class="bg-white mx-6 mt-6 p-8 pb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-[18px] font-bold text-slate-900 uppercase underline decoration-2 underline-offset-4 mb-2">INFORME</h1>
                    <p class="text-[13px] text-slate-800 mt-2">
                        Los parámetros utilizados para el presente informe corresponden del <br/>
                        <span class="underline decoration-1 underline-offset-2">${startDateStr}</span> al <span class="underline decoration-1 underline-offset-2">${endDateStr}</span>
                    </p>
                </div>
                <div>
                    ${icon ? `<img src="${icon}" class="h-16 w-16 object-contain" />` : `
                    <div class="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                        <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>` }
                </div>
            </div>
            
            <div class="w-full h-[4px] bg-[#2563eb] mt-4 mb-6"></div>
            
            <div class="flex justify-between items-start mb-8">
                <div>
                    <h2 class="text-xl font-bold text-[#1e293b] uppercase tracking-tight mb-3">${mission.delito || mission.nombre_delito || 'REPORTE DE MISIÓN'}</h2>
                    <span class="px-3 py-1 rounded border text-[11px] font-bold uppercase ${prioClasses}">PRIORIDAD ${mission.prioridad || 'NORMAL'}</span>
                </div>
                <div>
                    <div class="bg-[#f8fafc] px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <span class="text-sm font-bold text-slate-600 tracking-wider">FOLIO: ${mission.folio || 'S/N'}</span>
                    </div>
                </div>
            </div>

            <!-- CARDS GRID -->
            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="text-[10px] font-bold text-slate-400 mb-1 tracking-widest uppercase flex items-center gap-1">
                        <svg class="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                        DIRECCIÓN
                    </div>
                    <div class="text-sm font-medium text-slate-800">${mission.direccion || '-'}</div>
                </div>

                <div class="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="text-[10px] font-bold text-slate-400 mb-1 tracking-widest uppercase">COLONIA</div>
                    <div class="text-sm font-medium text-slate-800">${mission.colonia || '-'}</div>
                </div>

                <div class="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="text-[10px] font-bold text-slate-400 mb-1 tracking-widest uppercase">MUNICIPIO Y ESTADO</div>
                    <div class="text-sm font-medium text-slate-800">${mission.municipio || ''}${mission.municipio && mission.estado ? ', ' : ''}${mission.estado || '-'}</div>
                </div>

                <div class="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="text-[10px] font-bold text-slate-400 mb-1 tracking-widest uppercase">CÓDIGO POSTAL</div>
                    <div class="text-sm font-medium text-slate-800">${mission.postal || mission.codigo_postal || '-'}</div>
                </div>

                <div class="border border-slate-200 rounded-xl p-4 bg-white shadow-sm col-span-2">
                    <div class="text-[10px] font-bold text-slate-400 mb-1 tracking-widest uppercase">REFERENCIAS</div>
                    <div class="text-sm font-medium text-slate-800">${mission.referencias || '-'}</div>
                </div>

                <div class="border border-slate-200 rounded-xl p-4 bg-white shadow-sm col-span-2">
                    <div class="text-[10px] font-bold text-slate-400 mb-1 tracking-widest uppercase">NARRATIVA DE LOS HECHOS</div>
                    <div class="text-sm font-medium text-slate-800">${mission.narrativa || mission.narrativa_hechos || '-'}</div>
                </div>
            </div>

            ${finalizationHtml}

            <!-- MAP -->
            <div class="break-inside-avoid w-full pt-6">
                <h2 class="text-lg font-bold mt-8 mb-4 text-[#2563eb]">Ruta Recorrida</h2>
                <div id="map" class="w-full h-[380px] bg-gray-200 rounded-xl border border-gray-300 shadow-sm relative z-0 mb-8"></div>
            </div>


        </div>

        <!-- PAGE 2 -->
        <div class="mx-6 my-6 bg-white p-8 rounded-xl shadow-md border border-slate-200">
            <h2 class="text-lg font-bold mb-4 text-[#2563eb]">Bitácora de Despacho</h2>
            <div class="rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-10">
                <table class="w-full text-left bg-white">
                    <thead class="bg-slate-100 text-slate-600">
                        <tr>
                            <th class="p-3 text-xs font-bold uppercase tracking-wider border-b border-slate-200 w-1/4">Fecha/Hora</th>
                            <th class="p-3 text-xs font-bold uppercase tracking-wider border-b border-slate-200 w-1/4">Tipo</th>
                            <th class="p-3 text-xs font-bold uppercase tracking-wider border-b border-slate-200">Detalle</th>
                        </tr>
                    </thead>
                    <tbody>${logsHtml}</tbody>
                </table>
            </div>

            <!-- UNITS -->
            <h2 class="text-lg font-bold mb-4 text-[#2563eb]">Unidades Asignadas</h2>
            <div class="rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-10">
                <table class="w-full text-left bg-white">
                    <thead class="bg-[#2563eb] text-white">
                        <tr>
                            <th class="p-3 text-xs font-bold tracking-wider w-1/3">Unidad</th>
                            <th class="p-3 text-xs font-bold tracking-wider w-1/3">Estado</th>
                            <th class="p-3 text-xs font-bold tracking-wider w-1/3">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>${unitsHtml}</tbody>
                </table>
            </div>

            <h2 class="text-lg font-bold mb-4 text-[#2563eb]">Registro de Chat</h2>
            <div class="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table class="w-full text-left bg-white">
                    <thead class="bg-slate-100 text-slate-600">
                        <tr>
                            <th class="p-3 text-xs font-bold uppercase tracking-wider border-b border-slate-200 w-1/4">Fecha/Hora</th>
                            <th class="p-3 text-xs font-bold uppercase tracking-wider border-b border-slate-200 w-1/4">Usuario</th>
                            <th class="p-3 text-xs font-bold uppercase tracking-wider border-b border-slate-200">Mensaje</th>
                        </tr>
                    </thead>
                    <tbody>${chatHtml}</tbody>
                </table>
            </div>
        </div>

        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        ${generateMapScript()}
    </body>
    </html>
    `;

    const PDF = await htmlPDF.create(CONTENT, {
        waitUntil: 'networkidle0',
        timeout: 30000
    });
    return PDF;
};
