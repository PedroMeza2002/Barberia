// ============================================
// SCRIPT.JS - Página Principal Actualizada
// ============================================

// 1. DATOS INICIALES
let barberos = []; // Se llenará desde Supabase
let horariosDisponibles = []; // Horarios en filas (8:00 - 19:00)

const servicios = [
    { id: 1, nombre: "Corte", precio: 30000 },
    { id: 2, nombre: "Corte con sombreado", precio: 40000 },
    { id: 3, nombre: "Barba máquina", precio: 10000 },
    { id: 4, nombre: "Barba navaja", precio: 15000 },
    { id: 5, nombre: "Cejas", precio: 5000 }
];

// 2. CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://hcueuizcuiwscxqcmabn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4nmQhV4bchtTGumi5J2qSA_7Rli-O1m';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let turnosReservados = [];
let serviciosSeleccionados = [];
let canalBarberos = null;
let canalTurnos = null;

// Variable global para fecha seleccionada en la tabla
let fechaSeleccionadaTabla = null;

// Variable para almacenar turnos para la tabla
let turnosParaTabla = [];

// 3. FUNCIONES DE LOCALSTORAGE (MÁS CONFIABLE QUE COOKIES)
function guardarTelefono(telefono) {
    localStorage.setItem('telefonoCliente', telefono);
    console.log("📱 Teléfono guardado en localStorage:", telefono);
}

function obtenerTelefono() {
    return localStorage.getItem('telefonoCliente');
}

function eliminarTelefono() {
    localStorage.removeItem('telefonoCliente');
    console.log("🗑️ Teléfono eliminado de localStorage");
}

// 4. FUNCIONES DE VALIDACIÓN DE FECHA/HORA - COMPLETAMENTE CORREGIDAS
function validarFechaHora(fecha, hora) {
    if (!fecha || !hora) return false;
    
    // Crear fecha seleccionada en hora local
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const [hHora, mHora] = hora.split(':').map(Number);
    
    const fechaSeleccionada = new Date(anio, mes - 1, dia, hHora, mHora, 0);
    const ahora = new Date();
    
    return fechaSeleccionada > ahora;
}

function obtenerHoraActual() {
    const ahora = new Date();
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    return horas + ':' + minutos;
}

function obtenerFechaActual() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const dia = hoy.getDate().toString().padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

function formatearFechaParaTabla(fechaStr) {
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    
    const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const diaSemana = diasSemana[fecha.getDay()];
    
    const diaFormateado = fecha.getDate().toString().padStart(2, '0');
    const mesFormateado = (fecha.getMonth() + 1).toString().padStart(2, '0');
    
    return `${diaSemana} ${diaFormateado}/${mesFormateado}`;
}

function esDiaLaborable(fecha) {
    if (!fecha) return true;
    const diaSemana = fecha.getDay();
    return diaSemana !== 0;
}

function obtenerNombreDia(fecha) {
    const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    return diasSemana[fecha.getDay()];
}

function esHoy(fecha) {
    if (!fecha) return false;
    const hoy = new Date();
    const fechaComparar = new Date(fecha);
    return hoy.getFullYear() === fechaComparar.getFullYear() &&
           hoy.getMonth() === fechaComparar.getMonth() &&
           hoy.getDate() === fechaComparar.getDate();
}

function esHorarioPasado(fecha, hora) {
    if (!fecha || !hora) return false;
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const [hHora, mHora] = hora.split(':').map(Number);
    const fechaHoraSeleccionada = new Date(anio, mes - 1, dia, hHora, mHora, 0);
    const ahora = new Date();
    return fechaHoraSeleccionada < ahora;
}

function mostrarDebugFechas() {
    console.log("=== DEBUG FECHAS ===");
    console.log("Fecha seleccionada en tabla:", fechaSeleccionadaTabla);
    console.log("Fecha actual:", new Date());
    console.log("Es hoy?", esHoy(fechaSeleccionadaTabla));
    console.log("Es día laborable?", esDiaLaborable(fechaSeleccionadaTabla));
    console.log("Turnos cargados para tabla:", turnosParaTabla ? turnosParaTabla.length : 0);
    console.log("Barberos disponibles:", barberos.filter(b => b.disponible).length);
    console.log("Horarios generados:", horariosDisponibles.length);
}

// 5. INICIALIZACIÓN MEJORADA
document.addEventListener('DOMContentLoaded', async function () {
    console.log("=== 🚀 INICIANDO PÁGINA ===");
    
    const telefonoGuardado = obtenerTelefono();
    console.log("📞 Teléfono guardado:", telefonoGuardado);
    
    if (telefonoGuardado) {
        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput) {
            telefonoInput.value = telefonoGuardado;
            console.log("✅ Teléfono cargado en input:", telefonoGuardado);
        }
    }
    
    await cargarBarberosDesdeNube();
    cargarSelectBarberos();
    inicializarFecha();
    cargarHorarios();
    cargarCheckboxServicios();
    
    if (telefonoGuardado) {
        console.log("🔍 Cargando turnos para:", telefonoGuardado);
        await cargarTurnosDesdeNube();
    } else {
        console.log("ℹ️ No hay teléfono guardado, mostrando mensaje inicial");
        mostrarMensajeInicial();
    }
    
    await cargarTablaDisponibilidad();
    mostrarInfoTelefono();
    configurarEventos();
    configurarSuscripcionesRealtime();
    agregarDebugConsole();
    
    console.log("=== ✅ PÁGINA INICIALIZADA CORRECTAMENTE ===");
});

// 6. FUNCIONES DE CARGA DE BARBEROS
async function cargarBarberosDesdeNube() {
    console.log("🔄 Cargando barberos desde Supabase...");
    
    try {
        const { data: barberosDB, error } = await _supabase
            .from('barberos')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('❌ Error cargando barberos:', error);
            mostrarMensaje('Error al cargar barberos', 'error');
            return;
        }
        
        console.log("✅ Barberos recibidos:", barberosDB);
        
        barberos = barberosDB.map(b => ({
            id: b.id,
            nombre: b.nombre || "Sin nombre",
            especialidad: b.especialidad || "Corte y barba",
            disponible: b.activo !== false,
            telefono: b.telefono || "",
            email: b.email || "",
            iniciales: b.nombre ? b.nombre.charAt(0).toUpperCase() : "B"
        }));
        
        renderizarBarberos();
        actualizarContadorDisponibles();
        
    } catch (error) {
        console.error("❌ Error en cargarBarberosDesdeNube:", error);
        mostrarMensaje("Error al cargar barberos", "error");
    }
}

// 7. FUNCIÓN PARA CARGAR TURNOS
async function cargarTurnosDesdeNube() {
    try {
        console.log("🔄 Iniciando carga de turnos...");
        
        let telefono = '';
        const telefonoInput = document.getElementById('telefono');
        
        if (telefonoInput && telefonoInput.value.trim()) {
            telefono = telefonoInput.value.trim();
            console.log("📱 Teléfono desde input:", telefono);
            guardarTelefono(telefono);
        } else {
            telefono = obtenerTelefono();
            console.log("💾 Teléfono desde localStorage:", telefono);
            if (telefono && telefonoInput && !telefonoInput.value) {
                telefonoInput.value = telefono;
            }
        }
        
        if (!telefono) {
            console.log("⚠️ No se encontró teléfono");
            mostrarMensajeInicial();
            return;
        }
        
        console.log("🔍 Consultando turnos para teléfono:", telefono);
        
        const { data, error } = await _supabase
            .from('turnos')
            .select('*')
            .eq('completado', false)
            .eq('telefono', telefono)
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });

        if (error) {
            console.error('❌ Error cargando turnos:', error);
            mostrarMensaje('Error al cargar turnos', 'error');
            return;
        }

        console.log("✅ Turnos recibidos:", data ? data.length : 0);
        turnosReservados = data || [];
        renderizarTurnos();
        
    } catch (error) {
        console.error("❌ Error en cargarTurnosDesdeNube:", error);
    }
}

function mostrarMensajeInicial() {
    const container = document.getElementById('turnos-container');
    const telefonoGuardado = obtenerTelefono();
    
    if (container) {
        let mensaje = '';
        
        if (telefonoGuardado) {
            mensaje = `No tienes turnos reservados con el teléfono: ${telefonoGuardado}`;
        } else {
            mensaje = 'Reserva tu primer turno para comenzar';
        }
        
        container.innerHTML = `
            <div class="sin-turnos">
                <i class="fas fa-calendar-plus"></i>
                <p>${mensaje}</p>
            </div>
        `;
    }
}

// ============================================
// FUNCIONES PARA NUEVA TABLA DE DISPONIBILIDAD
// (BARBEROS vs HORARIOS)
// ============================================

async function cargarTablaDisponibilidad() {
    console.log("📊 Cargando tabla de disponibilidad (BARBEROS vs HORARIOS)...");
    
    if (barberos.length === 0) {
        await cargarBarberosDesdeNube();
    }
    
    if (!fechaSeleccionadaTabla) {
        fechaSeleccionadaTabla = new Date();
        fechaSeleccionadaTabla.setHours(0, 0, 0, 0);
    }
    
    console.log("📅 Fecha para tabla:", fechaSeleccionadaTabla);
    
    generarHorariosParaTabla();
    await cargarTurnosParaFecha(fechaSeleccionadaTabla);
    mostrarDebugFechas();
    renderizarTablaBarberosHorarios(fechaSeleccionadaTabla);
}

function obtenerFechaSeleccionadaTabla() {
    if (!fechaSeleccionadaTabla) {
        fechaSeleccionadaTabla = new Date();
        fechaSeleccionadaTabla.setHours(0, 0, 0, 0);
    }
    return fechaSeleccionadaTabla;
}

// ✅ FUNCIÓN CORREGIDA: generarHorariosParaTabla (Horarios hasta 19:00, descanso solo 12:00-12:30)
function generarHorariosParaTabla() {
    console.log("⏰ Generando horarios del día...");
    
    const horarios = [];
    const fechaBase = fechaSeleccionadaTabla || new Date();
    const esMismoDia = esHoy(fechaBase);
    const ahora = new Date();
    
    console.log("Fecha base:", fechaBase);
    console.log("Es hoy?", esMismoDia);
    console.log("Hora actual:", ahora.getHours() + ":" + ahora.getMinutes());
    
    // Horario: 8:00 a 19:00 con intervalos de 30 min
    for (let h = 8; h <= 19; h++) {
        for (let m = 0; m < 60; m += 30) {
            if (h === 19 && m > 0) break; // Solo hasta 19:00
            
            const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            
            // ✅ Descanso SOLO de 12:00 a 12:30
            const esDescanso = (h === 12); // 12:00 y 12:30 son descanso
            
            if (esDescanso) {
                horarios.push({
                    hora: hora,
                    esDescanso: true,
                    disponible: false
                });
            } else {
                let disponible = true;
                
                if (esMismoDia) {
                    const [hHora, mHora] = hora.split(':').map(Number);
                    const ahoraHora = ahora.getHours();
                    const ahoraMinutos = ahora.getMinutes();
                    
                    if (hHora < ahoraHora || (hHora === ahoraHora && mHora <= ahoraMinutos)) {
                        disponible = false;
                    }
                }
                
                horarios.push({
                    hora: hora,
                    esDescanso: false,
                    disponible: disponible
                });
            }
        }
    }
    
    horariosDisponibles = horarios;
    console.log("✅ Horarios generados:", horariosDisponibles.length);
    
    const descansos = horarios.filter(h => h.esDescanso).map(h => h.hora);
    console.log("🕐 Horarios de descanso (12:00-12:30):", descansos);
    console.log("Último horario:", horarios[horarios.length - 1].hora);
}

async function cargarTurnosParaFecha(fecha) {
    try {
        const fechaStr = fecha.toISOString().split('T')[0];
        console.log("🔍 Cargando turnos para fecha:", fechaStr);
        
        const cacheKey = `turnos_${fechaStr}`;
        const cacheTime = localStorage.getItem(`${cacheKey}_time`);
        
        if (cacheTime && (Date.now() - parseInt(cacheTime)) < 10000) {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                console.log("📦 Usando datos en caché para:", fechaStr);
                turnosParaTabla = JSON.parse(cachedData);
                return turnosParaTabla;
            }
        }
        
        const { data, error } = await _supabase
            .from('turnos')
            .select('id, fecha, hora, barbero_id, barbero_nombre')
            .eq('fecha', fechaStr)
            .eq('completado', false)
            .order('hora', { ascending: true });

        if (error) {
            console.error('❌ Error cargando turnos para tabla:', error);
            return [];
        }

        console.log("✅ Turnos encontrados para tabla:", data ? data.length : 0);
        turnosParaTabla = data || [];
        
        localStorage.setItem(cacheKey, JSON.stringify(turnosParaTabla));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        
        return turnosParaTabla;
        
    } catch (error) {
        console.error("❌ Error en cargarTurnosParaFecha:", error);
        return [];
    }
}

async function limpiarCacheTurnos() {
    if (!fechaSeleccionadaTabla) return;
    const fechaStr = fechaSeleccionadaTabla.toISOString().split('T')[0];
    const cacheKey = `turnos_${fechaStr}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_time`);
    console.log("🗑️ Caché limpiado para fecha:", fechaStr);
}

function renderizarTablaBarberosHorarios(fecha) {
    const container = document.getElementById('calendario-dias');
    const mesActual = document.getElementById('mes-actual');
    
    if (!container || !mesActual) return;
    
    const fechaStr = fecha.toISOString().split('T')[0];
    const fechaFormateada = formatearFechaParaTabla(fechaStr);
    
    mesActual.textContent = fechaFormateada;
    
    const barberosDisponibles = barberos.filter(b => b.disponible);
    
    let tablaHTML = `
        <div class="tabla-disponibilidad-container">
            <div class="tabla-scroll">
                <table class="tabla-disponibilidad">
                    <thead>
                        <tr>
                            <th class="col-horario">HORARIO</th>
    `;
    
    barberosDisponibles.forEach(barbero => {
        tablaHTML += `<th class="col-barbero">${barbero.nombre.toUpperCase()}</th>`;
    });
    
    tablaHTML += `
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    horariosDisponibles.forEach((horario) => {
        const esDescanso = horario.esDescanso;
        const esHoyFecha = esHoy(fecha);
        const esPasado = esHoyFecha && !horario.disponible && !esDescanso;
        
        if (esDescanso) {
            tablaHTML += `
                <tr class="fila-descanso">
                    <td class="celda-horario celda-descanso-horario">
                        <div class="horario-texto">${horario.hora}</div>
                        <div class="descanso-texto">DESCANSO</div>
                    </td>
            `;
            
            barberosDisponibles.forEach(barbero => {
                tablaHTML += `
                    <td class="celda-barbero celda-descanso" 
                        data-barbero-id="${barbero.id}"
                        data-barbero-nombre="${barbero.nombre}"
                        data-hora="${horario.hora}"
                        data-fecha="${fechaStr}"
                        data-estado="DESCANSO"
                        title="Horario de descanso/almuerzo (12:00-12:30)">
                        
                        <div class="estado-contenido">
                            <span class="texto-descanso">DESCANSO</span>
                        </div>
                    </td>
                `;
            });
            
            tablaHTML += `</tr>`;
        } else {
            const claseFila = esPasado ? 'fila-pasada' : '';
            tablaHTML += `
                <tr class="${claseFila}" data-hora="${horario.hora}">
                    <td class="celda-horario ${esPasado ? 'celda-pasada' : ''}">
                        <div class="horario-texto">${horario.hora}</div>
                        ${esPasado ? '<div class="pasado-texto">PASADO</div>' : ''}
                    </td>
            `;
            
            barberosDisponibles.forEach(barbero => {
                const estado = obtenerEstadoBarberoEnHorario(barbero.id, horario.hora);
                const claseEstado = obtenerClaseEstadoBarbero(estado);
                const textoEstado = obtenerTextoEstadoBarbero(estado, barbero);
                const esSeleccionable = estado === 'DISPONIBLE' && !esPasado;
                const esNoLaborable = !esDiaLaborable(fecha);
                
                let claseFinal = `celda-barbero ${claseEstado}`;
                if (esSeleccionable) claseFinal += ' seleccionable';
                if (esNoLaborable) claseFinal += ' estado-no-laborable';
                
                tablaHTML += `
                    <td class="${claseFinal}" 
                        data-barbero-id="${barbero.id}"
                        data-barbero-nombre="${barbero.nombre}"
                        data-hora="${horario.hora}"
                        data-fecha="${fechaStr}"
                        data-estado="${estado}"
                        ${esSeleccionable && !esNoLaborable ? 'onclick="seleccionarCeldaBarbero(this)"' : ''}
                        title="${obtenerTooltipBarbero(estado, barbero, horario.hora, esNoLaborable)}"
                        data-iniciales="${barbero.iniciales}">
                        
                        <div class="estado-contenido">
                            ${textoEstado}
                        </div>
                    </td>
                `;
            });
            
            tablaHTML += `</tr>`;
        }
    });
    
    tablaHTML += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    container.innerHTML = tablaHTML;
    agregarNavegacionTablaBarberos(fecha);
    actualizarLeyendaTablaBarberos();
}

// ✅ FUNCIÓN CORREGIDA: obtenerEstadoBarberoEnHorario (Descanso solo 12:00-12:30)
function obtenerEstadoBarberoEnHorario(barberoId, hora) {
    if (!fechaSeleccionadaTabla) return 'NO_LABORABLE';
    
    if (!esDiaLaborable(fechaSeleccionadaTabla)) {
        return 'NO_LABORABLE';
    }
    
    const [hHora, mHora] = hora.split(':').map(Number);
    const minutosHora = hHora * 60 + mHora;
    
    // ✅ Descanso SOLO de 12:00 a 12:30
    const descansoInicio = 12 * 60;       // 12:00
    const descansoFin = 12 * 60 + 30;     // 12:30
    
    if (minutosHora >= descansoInicio && minutosHora <= descansoFin) {
        return 'DESCANSO';
    }
    
    if (esHoy(fechaSeleccionadaTabla)) {
        const ahora = new Date();
        const minutosActual = ahora.getHours() * 60 + ahora.getMinutes();
        
        if (minutosHora < minutosActual) {
            return 'PASADO';
        }
    }
    
    if (turnosParaTabla && turnosParaTabla.length > 0) {
        const turnoExistente = turnosParaTabla.find(t => 
            t.barbero_id === barberoId && t.hora === hora
        );
        
        if (turnoExistente) {
            return 'OCUPADO';
        }
    }
    
    return 'DISPONIBLE';
}

function obtenerClaseEstadoBarbero(estado) {
    switch(estado) {
        case 'DISPONIBLE': return 'estado-disponible-barbero';
        case 'OCUPADO': return 'estado-ocupado-barbero';
        case 'DESCANSO': return 'estado-descanso-barbero';
        case 'NO_LABORABLE': return 'estado-no-laborable';
        case 'PASADO': return 'estado-pasado-barbero';
        default: return '';
    }
}

function obtenerTextoEstadoBarbero(estado, barbero) {
    switch(estado) {
        case 'DISPONIBLE': 
            return `<span class="texto-disponible">LIBRE</span><span class="nombre-barbero">${barbero.nombre}</span>`;
        case 'OCUPADO': 
            return `<span class="texto-ocupado">OCUPADO</span>`;
        case 'DESCANSO': 
            return `<span class="texto-descanso">DESCANSO</span>`;
        case 'NO_LABORABLE':
            return `<span class="texto-no-laborable">CERRADO</span>`;
        case 'PASADO':
            return `<span class="texto-pasado">PASADO</span>`;
        default: 
            return estado;
    }
}

function obtenerTooltipBarbero(estado, barbero, hora, esNoLaborable = false) {
    if (esNoLaborable) {
        return "Día no laborable (solo domingos)";
    }
    
    switch(estado) {
        case 'DISPONIBLE': 
            return `Click para reservar con ${barbero.nombre} a las ${hora} hs`;
        case 'OCUPADO': 
            return `${barbero.nombre} ya tiene un turno a las ${hora} hs`;
        case 'DESCANSO': 
            return `Horario de descanso/almuerzo (12:00-12:30)`;
        case 'NO_LABORABLE':
            return `Día no laborable (solo domingos)`;
        case 'PASADO':
            return `Horario ya pasó (solo aplica para hoy)`;
        default: 
            return '';
    }
}

function seleccionarCeldaBarbero(celda) {
    const barberoId = parseInt(celda.dataset.barberoId);
    const barberoNombre = celda.dataset.barberoNombre;
    const hora = celda.dataset.hora;
    const fecha = celda.dataset.fecha;
    const estado = celda.dataset.estado;
    
    console.log("📅 Celda seleccionada:", { barberoId, barberoNombre, hora, fecha, estado });
    
    if (estado !== 'DISPONIBLE') {
        switch(estado) {
            case 'OCUPADO':
                mostrarMensaje('Este horario ya está ocupado. Por favor, selecciona otro.', 'error');
                break;
            case 'DESCANSO':
                mostrarMensaje('Este es un horario de descanso (12:00-12:30). Por favor, selecciona otro.', 'error');
                break;
            case 'PASADO':
                mostrarMensaje('No puedes seleccionar un horario que ya pasó.', 'error');
                break;
            case 'NO_LABORABLE':
                mostrarMensaje('Este día no es laborable (solo domingos).', 'error');
                break;
        }
        return;
    }
    
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaObj = new Date(anio, mes - 1, dia);
    
    if (esHoy(fechaObj)) {
        const ahora = new Date();
        const [hHora, mHora] = hora.split(':').map(Number);
        const minutosHora = hHora * 60 + mHora;
        const minutosActual = ahora.getHours() * 60 + ahora.getMinutes();
        
        if (minutosHora < minutosActual) {
            mostrarMensaje('No puedes seleccionar un horario que ya pasó', 'error');
            return;
        }
    }
    
    if (!esDiaLaborable(fechaObj)) {
        mostrarMensaje('Este día no es laborable (solo domingos)', 'error');
        return;
    }
    
    const fechaInput = document.getElementById('fecha');
    const horaSelect = document.getElementById('hora');
    const barberoSelect = document.getElementById('barbero');
    
    if (fechaInput && horaSelect && barberoSelect) {
        fechaInput.value = fecha;
        
        let option = [...horaSelect.options].find(opt => opt.value === hora);
        
        if (!option) {
            option = document.createElement('option');
            option.value = hora;
            option.textContent = hora;
            horaSelect.appendChild(option);
        }
        
        horaSelect.value = hora;
        barberoSelect.value = barberoId;
        
        const fechaFormateada = formatearFecha(fecha);
        
        mostrarMensaje(`Turno seleccionado: ${fechaFormateada} a las ${hora} hs con ${barberoNombre}`, 'exito');
        
        document.querySelector('.reserva-section').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        document.querySelectorAll('.seleccionable').forEach(c => {
            c.classList.remove('seleccionada');
        });
        
        celda.classList.add('seleccionada');
    }
}

function agregarNavegacionTablaBarberos(fecha) {
    const header = document.querySelector('.calendario-header');
    if (!header) return;
    
    let navContainer = header.querySelector('.navegacion-tabla-barberos');
    if (!navContainer) {
        navContainer = document.createElement('div');
        navContainer.className = 'navegacion-tabla-barberos';
        header.appendChild(navContainer);
    }
    
    const esHoyFecha = esHoy(fecha);
    const esLaborable = esDiaLaborable(fecha);
    
    navContainer.innerHTML = `
        <div class="controles-fecha">
            <button class="btn-navegacion" id="btn-dia-anterior-barbero">
                <i class="fas fa-chevron-left"></i> Día anterior
            </button>
            
            <div class="fecha-actual-display">
                <div class="fecha-principal">${fechaFormateada(fecha)}</div>
                <div class="dia-semana">${obtenerNombreDia(fecha)} ${!esLaborable ? '🔒' : ''}</div>
            </div>
            
            <button class="btn-navegacion" id="btn-dia-siguiente-barbero">
                Día siguiente <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        
        <div class="controles-extra">
            <button class="btn-accion ${esHoyFecha ? 'active' : ''}" id="btn-hoy-barbero">
                <i class="fas fa-calendar-day"></i> Hoy
            </button>
            
            <div class="info-barberos">
                <i class="fas fa-users"></i> ${barberos.filter(b => b.disponible).length} barberos
                ${!esLaborable ? '<span class="cerrado-badge">CERRADO</span>' : ''}
            </div>
        </div>
    `;
    
    document.getElementById('btn-dia-anterior-barbero')?.addEventListener('click', () => cambiarDiaTablaBarbero(-1));
    document.getElementById('btn-hoy-barbero')?.addEventListener('click', () => irAlHoyTablaBarbero());
    document.getElementById('btn-dia-siguiente-barbero')?.addEventListener('click', () => cambiarDiaTablaBarbero(1));
}

function fechaFormateada(fecha) {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
}

function cambiarDiaTablaBarbero(dias) {
    if (!fechaSeleccionadaTabla) {
        fechaSeleccionadaTabla = new Date();
        fechaSeleccionadaTabla.setHours(0, 0, 0, 0);
    }

    const nuevaFecha = new Date(fechaSeleccionadaTabla);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (nuevaFecha < hoy) {
        mostrarMensaje('No se pueden ver fechas pasadas', 'error');
        return;
    }

    fechaSeleccionadaTabla = nuevaFecha;
    cargarTablaDisponibilidad();
}

function irAlHoyTablaBarbero() {
    fechaSeleccionadaTabla = new Date();
    fechaSeleccionadaTabla.setHours(0, 0, 0, 0);
    cargarTablaDisponibilidad();
    mostrarMensaje('Volviendo al día actual', 'exito');
}

function actualizarLeyendaTablaBarberos() {
    const leyendaContainer = document.querySelector('.calendario-leyenda');
    if (!leyendaContainer) return;
    
    leyendaContainer.innerHTML = `
        <div class="leyenda-tabla-barberos">
            <div class="leyenda-grupo">
                <div class="leyenda-item">
                    <span class="leyenda-color disponible-barbero"></span>
                    <span class="leyenda-texto">Libre - Click para reservar</span>
                </div>
                <div class="leyenda-item">
                    <span class="leyenda-color ocupado-barbero"></span>
                    <span class="leyenda-texto">Ocupado</span>
                </div>
                <div class="leyenda-item">
                    <span class="leyenda-color descanso-barbero"></span>
                    <span class="leyenda-texto">Descanso/Almuerzo (12:00-12:30)</span>
                </div>
            </div>
            <div class="leyenda-grupo">
                <div class="leyenda-item">
                    <span class="leyenda-color pasado-barbero"></span>
                    <span class="leyenda-texto">Horario pasado (solo hoy)</span>
                </div>
                <div class="leyenda-item">
                    <span class="leyenda-color seleccionado-barbero"></span>
                    <span class="leyenda-texto">Seleccionado</span>
                </div>
                <div class="leyenda-item">
                    <span class="leyenda-color no-laborable-barbero"></span>
                    <span class="leyenda-texto">Cerrado (domingos)</span>
                </div>
            </div>
        </div>
    `;
}

// ✅ FUNCIÓN CORREGIDA: cargarHorarios (Horarios hasta 19:00, descanso solo 12:00-12:30)
function cargarHorarios() {
    const select = document.getElementById('hora');
    if (!select) return;
    
    const fechaInput = document.getElementById('fecha');
    const fechaSeleccionada = fechaInput ? fechaInput.value : '';
    
    console.log("🔄 Cargando horarios para fecha:", fechaSeleccionada);
    
    if (!fechaSeleccionada) {
        select.innerHTML = '<option value="">Selecciona una fecha primero</option>';
        select.disabled = true;
        return;
    }

    const [anio, mes, dia] = fechaSeleccionada.split('-').map(Number);
    const fechaObj = new Date(anio, mes - 1, dia);
    
    if (!esDiaLaborable(fechaObj)) {
        select.innerHTML = '<option value="">Día no laborable (domingo)</option>';
        select.disabled = true;
        return;
    }
    
    const esHoyFecha = esHoy(fechaObj);
    const ahora = new Date();
    
    let opcionesHTML = '<option value="">Selecciona una hora</option>';
    let horariosDisponibles = 0;
    
    // ✅ Descanso SOLO de 12:00 a 12:30
    const descansoInicio = 12 * 60;       // 12:00
    const descansoFin = 12 * 60 + 30;     // 12:30
    
    // ✅ Horarios SOLO hasta 19:00
    for (let h = 8; h <= 19; h++) {
        for (let m = 0; m < 60; m += 30) {
            if (h === 19 && m > 0) break; // Solo 19:00
            
            const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            const minutosHora = h * 60 + m;
            
            if (minutosHora >= descansoInicio && minutosHora <= descansoFin) {
                continue;
            }
            
            let disponible = true;
            if (esHoyFecha) {
                const minutosActual = ahora.getHours() * 60 + ahora.getMinutes();
                if (minutosHora < minutosActual) {
                    disponible = false;
                }
            }
            
            if (disponible) {
                opcionesHTML += `<option value="${hora}">${hora}</option>`;
                horariosDisponibles++;
            }
        }
    }
    
    select.innerHTML = opcionesHTML;
    select.disabled = horariosDisponibles === 0;
    
    if (horariosDisponibles === 0) {
        select.innerHTML = '<option value="">No hay horarios disponibles</option>';
    }
}

async function reservarTurno() {
    console.log("=== INTENTANDO RESERVAR TURNO ===");
    
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const barberoId = parseInt(document.getElementById('barbero').value);
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;

    console.log("Datos del formulario:", {
        nombre, telefono, barberoId, fecha, hora,
        serviciosSeleccionados: serviciosSeleccionados.length
    });

    if (!nombre || !telefono || !barberoId || !fecha || !hora || serviciosSeleccionados.length === 0) {
        console.error("❌ Validación fallida: Campos incompletos");
        mostrarMensaje('Por favor, completa todos los campos y selecciona servicios', 'error');
        return;
    }

    if (!validarFechaHora(fecha, hora)) {
        console.error("❌ Validación fallida: Fecha/hora en el pasado");
        mostrarMensaje('No puedes reservar un turno en el pasado. Por favor, selecciona una fecha y hora futuras.', 'error');
        return;
    }

    const barbero = barberos.find(b => b.id === barberoId);
    if (!barbero || !barbero.disponible) {
        console.error("❌ Barbero no disponible:", barbero);
        mostrarMensaje('El barbero seleccionado ya no está disponible. Por favor, selecciona otro.', 'error');
        cargarSelectBarberos();
        return;
    }

    try {
        console.log("🔍 Verificando disponibilidad atómica...");
        
        const { data: turnosExistentes, error: errorVerificacion } = await _supabase
            .from('turnos')
            .select('id')
            .eq('barbero_id', barberoId)
            .eq('fecha', fecha)
            .eq('hora', hora)
            .eq('completado', false);

        if (errorVerificacion) {
            console.error('❌ Error verificando disponibilidad:', errorVerificacion);
            mostrarMensaje('Error al verificar disponibilidad. Por favor, intente nuevamente.', 'error');
            return;
        }

        if (turnosExistentes && turnosExistentes.length > 0) {
            console.log("❌ Turno ya reservado por otro usuario:", turnosExistentes);
            mostrarMensaje('Este horario ya está reservado con este barbero. Por favor, selecciona otro horario.', 'error');
            
            await cargarTablaDisponibilidad();
            cargarHorarios();
            
            return;
        }

        console.log("✅ Horario disponible para reserva");

    } catch (error) {
        console.error("❌ Error en verificación atómica:", error);
        mostrarMensaje('Error al verificar disponibilidad. Por favor, intente nuevamente.', 'error');
        return;
    }

    const nuevoTurno = {
        cliente: nombre,
        telefono: telefono,
        barbero_id: barberoId,
        barbero_nombre: barbero.nombre,
        servicios: serviciosSeleccionados,
        precio_total: serviciosSeleccionados.reduce((sum, s) => sum + s.precio, 0),
        fecha: fecha,
        hora: hora,
        completado: false,
        fecha_creacion: new Date().toISOString()
    };

    console.log("📋 Reservando turno:", nuevoTurno);

    const { data, error } = await _supabase
        .from('turnos')
        .insert([nuevoTurno])
        .select();

    if (error) {
        console.error('❌ Error al reservar:', error);
        
        if (error.code === '23505') {
            mostrarMensaje('Este horario ya fue reservado por otra persona. Por favor, selecciona otro horario.', 'error');
            
            await cargarTablaDisponibilidad();
            cargarHorarios();
        } else {
            mostrarMensaje('Error al reservar: ' + error.message, 'error');
        }
    } else {
        console.log('✅ Turno reservado exitosamente en Supabase:', data);
        
        await limpiarCacheTurnos();
        enviarNotificacionWhatsapp(nuevoTurno);
        mostrarMensaje('✅ ¡Turno reservado exitosamente!', 'exito');
        guardarTelefono(telefono);
        limpiarFormulario();
        await cargarTurnosDesdeNube();
        await cargarTablaDisponibilidad();
        mostrarInfoTelefono();
        cargarHorarios();
    }
}

function configurarSuscripcionesRealtime() {
    console.log("📡 Configurando suscripciones en tiempo real...");
    
    canalBarberos = _supabase
        .channel('cambios-barberos-pagina')
        .on('postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'barberos' 
            }, 
            (payload) => {
                console.log('🔄 Cambio en barbero detectado:', payload);
                actualizarBarberoIndividual(payload.new);
            }
        )
        .subscribe((status) => {
            console.log('📶 Estado suscripción barberos:', status);
        });
    
    canalTurnos = _supabase
        .channel('cambios-turnos-pagina')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'turnos' 
            }, 
            async (payload) => {
                console.log('🔄 Nuevo turno insertado:', payload.new);
                await limpiarCacheTurnos();
                await Promise.all([
                    cargarTurnosDesdeNube(),
                    cargarTablaDisponibilidad()
                ]);
            }
        )
        .on('postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'turnos'
            },
            async (payload) => {
                console.log('🔄 Turno eliminado:', payload.old);
                await limpiarCacheTurnos();
                await Promise.all([
                    cargarTurnosDesdeNube(),
                    cargarTablaDisponibilidad()
                ]);
            }
        )
        .subscribe((status) => {
            console.log('📶 Estado suscripción turnos:', status);
        });
}

function actualizarBarberoIndividual(barberoNuevo) {
    const index = barberos.findIndex(b => b.id === barberoNuevo.id);
    if (index !== -1) {
        barberos[index] = {
            ...barberos[index],
            nombre: barberoNuevo.nombre || barberos[index].nombre,
            especialidad: barberoNuevo.especialidad || barberos[index].especialidad,
            disponible: barberoNuevo.activo !== false,
            telefono: barberoNuevo.telefono || barberos[index].telefono,
            email: barberoNuevo.email || barberos[index].email,
            iniciales: barberoNuevo.nombre ? barberoNuevo.nombre.charAt(0).toUpperCase() : "B"
        };
        
        actualizarBarberoEnUI(barberos[index]);
        actualizarSelectBarberos();
        actualizarContadorDisponibles();
        
        console.log("✅ Barbero actualizado en tiempo real:", barberos[index].nombre);
    }
}

function actualizarBarberoEnUI(barbero) {
    const barberoCards = document.querySelectorAll('.barbero-card');
    
    barberoCards.forEach(card => {
        const nombreElement = card.querySelector('.barbero-nombre');
        if (nombreElement && nombreElement.textContent === barbero.nombre) {
            const estadoElement = card.querySelector('.estado');
            if (estadoElement) {
                estadoElement.textContent = barbero.disponible ? 'DISPONIBLE' : 'NO DISPONIBLE';
                estadoElement.className = barbero.disponible ? 'estado estado-disponible' : 'estado estado-no-disponible';
            }
            
            card.className = `barbero-card ${barbero.disponible ? 'barbero-disponible' : 'barbero-no-disponible'}`;
        }
    });
}

function cargarSelectBarberos() {
    const select = document.getElementById('barbero');
    if (!select) return;
    
    const valorActual = select.value;
    
    select.innerHTML = '<option value="">Selecciona un barbero</option>';
    
    barberos.forEach(b => {
        if (b.disponible) {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = `${b.nombre} - ${b.especialidad}`;
            option.dataset.disponible = b.disponible;
            select.appendChild(option);
        }
    });
    
    if (valorActual && [...select.options].some(opt => opt.value === valorActual)) {
        select.value = valorActual;
    }
}

function inicializarFecha() {
    const input = document.getElementById('fecha');
    if (!input) return;
    
    const hoy = new Date();
    const hoyFormateado = hoy.toISOString().split('T')[0];
    
    input.value = hoyFormateado;
    input.min = hoyFormateado;
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    input.max = maxDateStr;
    
    console.log("📅 Fecha inicializada. Hoy:", hoyFormateado);
}

async function enviarNotificacionWhatsapp(reserva) {
    const TELEFONO_DUEÑO = "5959811234567";
    const API_KEY = "TU_API_KEY_AQUI";
    
    console.log("📱 Preparando notificación WhatsApp al barbero...");
    
    if (!reserva.cliente || !reserva.fecha || !reserva.hora || !reserva.barbero_nombre || !reserva.telefono) {
        console.error("❌ Datos incompletos para la notificación WhatsApp");
        return;
    }
    
    const [anio, mes, dia] = reserva.fecha.split('-').map(Number);
    const fechaObj = new Date(anio, mes - 1, dia);
    const fechaFormateada = fechaObj.toLocaleDateString('es-PY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    
    const serviciosTexto = reserva.servicios && Array.isArray(reserva.servicios) 
        ? reserva.servicios.map(s => s.nombre).join(', ')
        : 'No especificados';
    
    const mensaje = `💈 *¡NUEVA RESERVA CONFIRMADA!* 💈%0A%0A` +
                    `👤 *Cliente:* ${reserva.cliente}%0A` +
                    `📅 *Fecha:* ${fechaFormateada}%0A` +
                    `⏰ *Hora:* ${reserva.hora} hs%0A` +
                    `✂️ *Barbero:* ${reserva.barbero_nombre}%0A` +
                    `📞 *Teléfono:* ${reserva.telefono}%0A` +
                    `💰 *Total:* ${reserva.precio_total ? reserva.precio_total.toLocaleString('es-PY') + ' Gs' : 'No especificado'}%0A%0A` +
                    `📋 *Servicios:* ${serviciosTexto}`;
    
    const url = `https://api.callmebot.com/whatsapp.php?phone=${TELEFONO_DUEÑO}&text=${mensaje}&apikey=${API_KEY}`;
    
    try {
        console.log("🚀 Enviando notificación WhatsApp...");
        
        fetch(url, { 
            method: 'GET',
            mode: 'no-cors'
        }).then(() => {
            console.log("✅ Notificación WhatsApp enviada exitosamente al barbero");
        }).catch(error => {
            console.warn("⚠️ Advertencia al enviar WhatsApp:", error);
        });
        
    } catch (error) {
        console.error("❌ Error enviando notificación WhatsApp:", error);
    }
}

function renderizarTurnos() {
    const container = document.getElementById('turnos-container');
    if (!container) return;
    
    const tituloTurnos = document.getElementById('titulo-turnos');
    
    if (tituloTurnos) {
        tituloTurnos.textContent = 'Tus Turnos Reservados';
    }
    
    if (turnosReservados.length === 0) {
        const telefonoGuardado = obtenerTelefono();
        let mensaje = '';
        
        if (telefonoGuardado) {
            mensaje = 'No tienes turnos reservados. ¡Reserva tu primer turno!';
        } else {
            mensaje = 'Reserva tu primer turno para comenzar';
        }
        
        container.innerHTML = `
            <div class="sin-turnos">
                <i class="fas fa-calendar-times"></i>
                <p>${mensaje}</p>
            </div>
        `;
        return;
    }
    
    const turnosFuturos = turnosReservados.filter(turno => {
        return validarFechaHora(turno.fecha, turno.hora);
    });
    
    const turnosPasados = turnosReservados.filter(turno => {
        return !validarFechaHora(turno.fecha, turno.hora);
    });
    
    if (turnosPasados.length > 0) {
        console.log(`🗑️ ${turnosPasados.length} turnos pasados detectados`);
    }
    
    const turnosAMostrar = turnosFuturos.length > 0 ? turnosFuturos : turnosReservados;
    
    container.innerHTML = turnosAMostrar.map(turno => {
        const esPasado = !validarFechaHora(turno.fecha, turno.hora);
        const clasePasado = esPasado ? 'turno-pasado' : '';
        
        return `
        <div class="turno-card ${clasePasado}">
            <div class="turno-info">
                ${esPasado ? '<div class="turno-pasado-badge"><i class="fas fa-history"></i> PASADO</div>' : ''}
                <div class="turno-cliente">${turno.cliente}</div>
                <div class="turno-detalle">
                    <i class="fas fa-user"></i> ${turno.barbero_nombre}
                </div>
                <div class="turno-detalle">
                    <i class="fas fa-calendar"></i> ${formatearFecha(turno.fecha)}
                </div>
                <div class="turno-detalle">
                    <i class="fas fa-clock"></i> ${turno.hora} hs
                </div>
                <div class="turno-detalle">
                    <i class="fas fa-phone"></i> ${turno.telefono}
                </div>
                <div class="turno-detalle">
                    <i class="fas fa-scissors"></i> ${Array.isArray(turno.servicios) ? 
                        turno.servicios.map(s => s.nombre).join(' + ') : 
                        'Servicios'}
                </div>
                <div class="turno-detalle">
                    <i class="fas fa-money-bill-wave"></i> ${(turno.precio_total || 0).toLocaleString('es-PY')} Gs
                </div>
            </div>
            <button class="btn-danger" onclick="cancelarTurnoNube(${turno.id})" ${esPasado ? 'disabled title="No se puede cancelar un turno pasado"' : ''}>
                <i class="fas fa-times"></i> ${esPasado ? 'Expirado' : 'Cancelar'}
            </button>
        </div>
        `;
    }).join('');
}

function mostrarInfoTelefono() {
    const telefonoGuardado = obtenerTelefono();
    console.log("ℹ️ Mostrando info para teléfono:", telefonoGuardado);
    
    const infoDiv = document.getElementById('info-telefono');
    const telefonoSpan = document.getElementById('telefono-actual');
    
    if (telefonoGuardado && infoDiv && telefonoSpan) {
        telefonoSpan.textContent = telefonoGuardado;
        infoDiv.style.display = 'block';
        
        const cambiarBtn = document.getElementById('cambiar-telefono');
        if (cambiarBtn) {
            const newBtn = cambiarBtn.cloneNode(true);
            cambiarBtn.parentNode.replaceChild(newBtn, cambiarBtn);
            
            newBtn.addEventListener('click', function() {
                if (confirm('¿Deseas cambiar de teléfono? Esto limpiará tus turnos actuales.')) {
                    eliminarTelefono();
                    const telefonoInput = document.getElementById('telefono');
                    if (telefonoInput) telefonoInput.value = '';
                    turnosReservados = [];
                    renderizarTurnos();
                    infoDiv.style.display = 'none';
                    mostrarMensaje('Teléfono cambiado. Puedes ingresar uno nuevo.', 'exito');
                }
            });
        }
    } else if (infoDiv) {
        infoDiv.style.display = 'none';
    }
}

window.cancelarTurnoNube = async function(id) {
    if (!confirm('¿Estás seguro de que quieres CANCELAR y ELIMINAR este turno?')) {
        return;
    }
    
    try {
        const { error } = await _supabase
            .from('turnos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("❌ Error al eliminar turno:", error);
            mostrarMensaje("Error al eliminar turno: " + error.message, "error");
        } else {
            mostrarMensaje("✅ Turno eliminado exitosamente", "exito");
            await limpiarCacheTurnos();
            await cargarTablaDisponibilidad();
        }
    } catch (error) {
        console.error("❌ Error en cancelarTurnoNube:", error);
    }
}

function renderizarBarberos() {
    const container = document.getElementById('barberos-container');
    if (!container) {
        console.error("❌ No se encontró el contenedor de barberos");
        return;
    }

    if (barberos.length === 0) {
        container.innerHTML = `
            <div class="sin-turnos">
                <i class="fas fa-user-slash"></i>
                <p>No hay barberos registrados</p>
            </div>
        `;
        return;
    }

    container.innerHTML = barberos.map(b => {
        const disponible = b.disponible;
        const estadoTexto = disponible ? 'DISPONIBLE' : 'NO DISPONIBLE';
        const estadoClase = disponible ? 'estado-disponible' : 'estado-no-disponible';
        const cardClase = disponible ? 'barbero-disponible' : 'barbero-no-disponible';
        
        return `
        <div class="barbero-card ${cardClase}">
            <div class="barbero-header">
                <div class="barbero-nombre">${b.nombre}</div>
                <div class="estado ${estadoClase}">${estadoTexto}</div>
            </div>
        </div>
    `}).join('');
}

function actualizarContadorDisponibles() {
    const contador = document.getElementById('contador-disponibles');
    if (contador) {
        const disponibles = barberos.filter(b => b.disponible).length;
        contador.textContent = `(${disponibles} disponible${disponibles !== 1 ? 's' : ''})`;
        contador.className = `contador-badge ${disponibles > 0 ? 'disponible' : 'no-disponible'}`;
    }
}

function cargarCheckboxServicios() {
    const container = document.getElementById('servicios-container');
    if (!container) return;
    
    container.innerHTML = servicios.map(s => `
        <div class="checkbox-servicio">
            <label class="checkbox-label">
                <input type="checkbox" value="${s.id}" 
                       data-nombre="${s.nombre}" 
                       data-precio="${s.precio}">
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">
                    ${s.nombre} 
                    <strong>${formatearPrecio(s.precio)}</strong>
                </span>
            </label>
        </div>
    `).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', function() {
            const id = parseInt(this.value);
            const servicio = {
                id,
                nombre: this.dataset.nombre,
                precio: parseInt(this.dataset.precio)
            };
            
            if (this.checked) {
                serviciosSeleccionados.push(servicio);
            } else {
                serviciosSeleccionados = serviciosSeleccionados.filter(s => s.id !== id);
            }
            
            actualizarTotalPrecio();
        });
    });
}

function actualizarTotalPrecio() {
    const el = document.getElementById('total-precio');
    const total = serviciosSeleccionados.reduce((acc, s) => acc + s.precio, 0);
    
    if (el) {
        el.textContent = total > 0 ? `Total: ${formatearPrecio(total)}` : '';
        el.classList.toggle('mostrar', total > 0);
    }
}

function formatearPrecio(p) { 
    return p.toLocaleString('es-PY') + ' Gs'; 
}

function formatearFecha(f) {
    const [anio, mes, dia] = f.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    return fecha.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });
}

function limpiarFormulario() {
    document.getElementById('nombre').value = '';
    document.getElementById('barbero').selectedIndex = 0;
    document.getElementById('hora').selectedIndex = 0;
    
    document.querySelectorAll('#servicios-container input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    serviciosSeleccionados = [];
    actualizarTotalPrecio();
}

function mostrarMensaje(texto, tipo) {
    const el = document.getElementById('mensaje-reserva');
    if (!el) return;
    
    el.textContent = texto;
    el.className = `mensaje mensaje-${tipo}`;
    el.style.display = 'block';
    
    setTimeout(() => {
        el.style.display = 'none';
    }, 5000);
}

function configurarEventos() {
    console.log("⚙️ Configurando eventos...");
    
    const reservarBtn = document.getElementById('reservar-btn');
    if (reservarBtn) {
        const newBtn = reservarBtn.cloneNode(true);
        reservarBtn.parentNode.replaceChild(newBtn, reservarBtn);
        
        newBtn.addEventListener('click', async function() {
            newBtn.disabled = true;
            newBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reservando...';
            
            try {
                await reservarTurno();
            } catch (error) {
                console.error("❌ Error en reserva:", error);
                mostrarMensaje('Error al procesar la reserva. Por favor, intente nuevamente.', 'error');
            } finally {
                setTimeout(() => {
                    newBtn.disabled = false;
                    newBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Reservar Turno';
                }, 2000);
            }
        });
    }
    
    const menuToggle = document.querySelector('.menu-mobile-toggle');
    const navMobile = document.querySelector('.nav-mobile');
    if (menuToggle && navMobile) {
        menuToggle.addEventListener('click', () => {
            navMobile.classList.toggle('active');
            menuToggle.innerHTML = navMobile.classList.contains('active') ? 
                '<i class="fas fa-times"></i>' : 
                '<i class="fas fa-bars"></i>';
        });
    }
    
    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        let debounceTimer;
        telefonoInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (this.value.trim().length >= 6) {
                    console.log("🔍 Buscando turnos para:", this.value.trim());
                    cargarTurnosDesdeNube();
                } else if (this.value.trim().length === 0) {
                    turnosReservados = [];
                    renderizarTurnos();
                }
            }, 500);
        });
    }
    
    const buscarBtn = document.getElementById('buscar-turnos-btn');
    if (buscarBtn) {
        buscarBtn.addEventListener('click', async function() {
            const telefono = document.getElementById('telefono').value.trim();
            if (!telefono || telefono.length < 6) {
                mostrarMensaje('Por favor, ingresa un teléfono válido (mínimo 6 dígitos)', 'error');
                return;
            }
            console.log("🔍 Buscando manualmente turnos para:", telefono);
            await cargarTurnosDesdeNube();
        });
    }
    
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.addEventListener('change', function() {
            console.log("📅 Fecha cambiada a:", this.value);
            cargarHorarios();
        });
    }
}

function agregarDebugConsole() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const debugBtn = document.createElement('button');
        debugBtn.innerHTML = '🪲 Debug';
        debugBtn.style.position = 'fixed';
        debugBtn.style.bottom = '20px';
        debugBtn.style.right = '20px';
        debugBtn.style.zIndex = '9999';
        debugBtn.style.padding = '10px';
        debugBtn.style.background = '#ff4444';
        debugBtn.style.color = 'white';
        debugBtn.style.border = 'none';
        debugBtn.style.borderRadius = '5px';
        debugBtn.style.cursor = 'pointer';
        
        debugBtn.onclick = function() {
            mostrarDebugFechas();
            alert('Ver consola para información de debug');
        };
        
        document.body.appendChild(debugBtn);
    }
}

window.addEventListener('beforeunload', function() {
    if (canalBarberos) {
        _supabase.removeChannel(canalBarberos);
    }
    if (canalTurnos) {
        _supabase.removeChannel(canalTurnos);
    }
});

console.log("✅ script.js cargado correctamente con NUEVOS HORARIOS: 11:30 DISPONIBLE, DESCANSO 12:00-12:30, ÚLTIMO TURNO 19:00");