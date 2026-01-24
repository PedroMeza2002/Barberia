// ============================================
// SCRIPT.JS - Página Principal Actualizada
// ============================================

// 1. DATOS INICIALES
let barberos = []; // Se llenará desde Supabase
let fechaCalendario = new Date();
let reservasCalendario = []; // Para almacenar las reservas del mes actual

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

// 4. FUNCIONES DE VALIDACIÓN DE FECHA/HORA
function validarFechaHora(fecha, hora) {
    const ahora = new Date();
    const fechaSeleccionada = new Date(fecha + 'T' + hora + ':00');
    
    // Comparar fecha y hora
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
    return hoy.toISOString().split('T')[0];
}

// 5. INICIALIZACIÓN MEJORADA
document.addEventListener('DOMContentLoaded', async function () {
    console.log("=== 🚀 INICIANDO PÁGINA ===");
    
    // 1. CARGAR TELÉFONO DE LOCALSTORAGE INMEDIATAMENTE
    const telefonoGuardado = obtenerTelefono();
    console.log("📞 Teléfono guardado:", telefonoGuardado);
    
    // Rellenar input si hay teléfono guardado
    if (telefonoGuardado) {
        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput) {
            telefonoInput.value = telefonoGuardado;
            console.log("✅ Teléfono cargado en input:", telefonoGuardado);
        }
    }
    
    // 2. CARGAR BARBEROS
    await cargarBarberosDesdeNube();
    
    // 3. INICIALIZAR FORMULARIO
    cargarSelectBarberos();
    inicializarFecha();
    cargarHorarios(); // Cargar horarios según fecha actual
    cargarCheckboxServicios();
    
    // 4. CARGAR TURNOS SI HAY TELÉFONO
    if (telefonoGuardado) {
        console.log("🔍 Cargando turnos para:", telefonoGuardado);
        await cargarTurnosDesdeNube();
    } else {
        console.log("ℹ️ No hay teléfono guardado, mostrando mensaje inicial");
        mostrarMensajeInicial();
    }
    
    // 5. CARGAR CALENDARIO
    await cargarCalendario();
    
    // 6. MOSTRAR INFO DEL TELÉFONO
    mostrarInfoTelefono();
    
    // 7. CONFIGURAR EVENTOS
    configurarEventos();
    
    // 8. CONFIGURAR SUSCRIPCIONES EN TIEMPO REAL
    configurarSuscripcionesRealtime();
    
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
        
        // Procesar y guardar barberos
        barberos = barberosDB.map(b => ({
            id: b.id,
            nombre: b.nombre || "Sin nombre",
            especialidad: b.especialidad || "Corte y barba",
            disponible: b.activo !== false,
            telefono: b.telefono || "",
            email: b.email || ""
        }));
        
        // Renderizar barberos
        renderizarBarberos();
        
        // Actualizar contador
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
        
        // OBTENER TELÉFONO DE MÚLTIPLES FUENTES
        let telefono = '';
        const telefonoInput = document.getElementById('telefono');
        
        // 1. Del campo del formulario (si está lleno)
        if (telefonoInput && telefonoInput.value.trim()) {
            telefono = telefonoInput.value.trim();
            console.log("📱 Teléfono desde input:", telefono);
            // Guardar en localStorage
            guardarTelefono(telefono);
        }
        // 2. Del localStorage (si el input está vacío)
        else {
            telefono = obtenerTelefono();
            console.log("💾 Teléfono desde localStorage:", telefono);
            // Si hay teléfono guardado pero no en input, rellenar input
            if (telefono && telefonoInput && !telefonoInput.value) {
                telefonoInput.value = telefono;
            }
        }
        
        // Si no hay teléfono en absoluto
        if (!telefono) {
            console.log("⚠️ No se encontró teléfono");
            mostrarMensajeInicial();
            return;
        }
        
        console.log("🔍 Consultando turnos para teléfono:", telefono);
        
        // CONSULTA CON FILTRO POR TELÉFONO
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

// 8. FUNCIONES DE CALENDARIO
async function cargarCalendario() {
    console.log("📅 Cargando calendario...");
    
    // Cargar las reservas del mes actual
    await cargarReservasMes();
    
    // Generar y renderizar el calendario
    generarCalendario();
}

async function cargarReservasMes() {
    try {
        const año = fechaCalendario.getFullYear();
        const mes = fechaCalendario.getMonth() + 1; // Enero es 0
        
        // Calcular fechas de inicio y fin del mes
        const primerDia = new Date(año, mes - 1, 1);
        const ultimoDia = new Date(año, mes, 0);
        
        // Formatear fechas para la consulta
        const fechaInicio = primerDia.toISOString().split('T')[0];
        const fechaFin = ultimoDia.toISOString().split('T')[0];
        
        console.log(`📊 Cargando reservas del ${fechaInicio} al ${fechaFin}`);
        
        // Consultar todas las reservas del mes (sin filtrar por teléfono)
        const { data, error } = await _supabase
            .from('turnos')
            .select('fecha, barbero_nombre')
            .gte('fecha', fechaInicio)
            .lte('fecha', fechaFin)
            .eq('completado', false);

        if (error) {
            console.error('❌ Error cargando reservas del mes:', error);
            return;
        }

        // Agrupar reservas por fecha
        const reservasPorFecha = {};
        data.forEach(reserva => {
            if (!reservasPorFecha[reserva.fecha]) {
                reservasPorFecha[reserva.fecha] = [];
            }
            reservasPorFecha[reserva.fecha].push(reserva.barbero_nombre);
        });

        reservasCalendario = reservasPorFecha;
        console.log("✅ Reservas del mes cargadas:", reservasCalendario);
        
    } catch (error) {
        console.error("❌ Error en cargarReservasMes:", error);
    }
}

function generarCalendario() {
    const container = document.getElementById('calendario-dias');
    const mesActual = document.getElementById('mes-actual');
    
    if (!container || !mesActual) return;
    
    // Actualizar título del mes
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    mesActual.textContent = `${meses[fechaCalendario.getMonth()]} ${fechaCalendario.getFullYear()}`;
    
    // Obtener primer y último día del mes
    const año = fechaCalendario.getFullYear();
    const mes = fechaCalendario.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    
    // Obtener día de la semana del primer día (0 = Domingo, 1 = Lunes, etc.)
    let primerDiaSemana = primerDia.getDay();
    // Ajustar para que la semana empiece en Lunes (0 = Lunes)
    primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    
    // Limpiar container
    container.innerHTML = '';
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < primerDiaSemana; i++) {
        container.appendChild(crearDiaVacio());
    }
    
    // Agregar días del mes
    const hoy = new Date();
    const hoyFormateado = hoy.toISOString().split('T')[0];
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = new Date(año, mes, dia);
        const fechaFormateada = fecha.toISOString().split('T')[0];
        const esHoy = fechaFormateada === hoyFormateado;
        const esPasado = fecha < hoy && !esHoy;
        
        // Obtener reservas para esta fecha
        const reservasDia = reservasCalendario[fechaFormateada] || [];
        const tieneReservas = reservasDia.length > 0;
        
        container.appendChild(crearDiaCalendario(dia, esHoy, esPasado, tieneReservas, reservasDia, fechaFormateada));
    }
}

function crearDiaVacio() {
    const diaDiv = document.createElement('div');
    diaDiv.className = 'dia-calendario dia-vacio';
    return diaDiv;
}

function crearDiaCalendario(dia, esHoy, esPasado, tieneReservas, reservas, fecha) {
    const diaDiv = document.createElement('div');
    
    // Determinar clase principal
    let clasePrincipal = 'dia-calendario';
    if (esHoy) {
        clasePrincipal += ' dia-hoy';
    } else if (esPasado) {
        clasePrincipal += ' dia-pasado';
    } else if (tieneReservas) {
        clasePrincipal += ' dia-reservado';
    } else {
        clasePrincipal += ' dia-disponible';
    }
    
    diaDiv.className = clasePrincipal;
    diaDiv.dataset.fecha = fecha;
    
    // Número del día
    const numeroDiv = document.createElement('div');
    numeroDiv.className = 'dia-numero';
    numeroDiv.textContent = dia;
    diaDiv.appendChild(numeroDiv);
    
    // Estado del día
    const estadoDiv = document.createElement('div');
    estadoDiv.className = 'dia-estado';
    
    if (esPasado) {
        estadoDiv.textContent = 'Pasado';
    } else if (tieneReservas) {
        estadoDiv.textContent = `${reservas.length} reserva${reservas.length !== 1 ? 's' : ''}`;
    } else {
        estadoDiv.textContent = 'Disponible';
    }
    
    diaDiv.appendChild(estadoDiv);
    
    // Tooltip con detalles de reservas
    if (tieneReservas && !esPasado) {
        diaDiv.title = `Reservas:\n${reservas.join('\n')}`;
    }
    
    // Evento click para seleccionar fecha en el formulario
    if (!esPasado) {
        diaDiv.addEventListener('click', () => {
            seleccionarFechaCalendario(fecha);
        });
    }
    
    return diaDiv;
}

function seleccionarFechaCalendario(fecha) {
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = fecha;
        console.log("📅 Fecha seleccionada en calendario:", fecha);
        
        // Actualizar horarios disponibles
        cargarHorarios();
        
        // Mostrar mensaje de confirmación
        const fechaFormateada = new Date(fecha + 'T00:00:00');
        const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
        const fechaTexto = fechaFormateada.toLocaleDateString('es-ES', opciones);
        
        mostrarMensaje(`Fecha seleccionada: ${fechaTexto}`, 'exito');
        
        // Desplazar suavemente al formulario
        document.querySelector('.reserva-section').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function cambiarMes(direccion) {
    if (direccion === 'prev') {
        fechaCalendario.setMonth(fechaCalendario.getMonth() - 1);
    } else if (direccion === 'next') {
        fechaCalendario.setMonth(fechaCalendario.getMonth() + 1);
    }
    
    cargarCalendario();
}

// 9. SUSCRIPCIONES EN TIEMPO REAL
function configurarSuscripcionesRealtime() {
    console.log("📡 Configurando suscripciones en tiempo real...");
    
    // Suscripción a cambios en barberos
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
    
    // Suscripción a cambios en turnos
    _supabase
        .channel('cambios-turnos-pagina')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'turnos' 
            }, 
            async () => {
                console.log('🔄 Cambio en turnos detectado, recargando...');
                await cargarTurnosDesdeNube();
                await cargarCalendario(); // También actualizar calendario
            }
        )
        .subscribe();
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
            email: barberoNuevo.email || barberos[index].email
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

// 10. FUNCIONES DE CARGA DE DATOS
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

function generarHorarios() {
    const horarios = [];
    for (let h = 8; h <= 11; h++) {
        for (let m = 0; m < 60; m += 30) {
            if (h === 11 && m > 30) break;
            horarios.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    for (let h = 13; h <= 19; h++) {
        for (let m = 0; m < 60; m += 30) {
            if (h === 19 && m > 0) break;
            horarios.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return horarios;
}

function cargarHorarios() {
    const select = document.getElementById('hora');
    if (!select) return;
    
    // Obtener la fecha seleccionada
    const fechaInput = document.getElementById('fecha');
    const fechaSeleccionada = fechaInput ? fechaInput.value : '';
    const hoy = new Date();
    const esHoy = fechaSeleccionada === hoy.toISOString().split('T')[0];
    
    // Generar todos los horarios disponibles
    const todosHorarios = generarHorarios();
    
    // Filtrar horas si es hoy
    let horariosDisponibles = todosHorarios;
    if (esHoy) {
        const horaActual = hoy.getHours();
        const minutoActual = hoy.getMinutes();
        const horaActualFormateada = horaActual.toString().padStart(2, '0') + ':' + 
                                   minutoActual.toString().padStart(2, '0');
        
        horariosDisponibles = todosHorarios.filter(hora => {
            // Convertir "08:00" a minutos para comparar
            const [hHora, mHora] = hora.split(':').map(Number);
            const minutosHora = hHora * 60 + mHora;
            const minutosActual = horaActual * 60 + minutoActual;
            
            // Solo mostrar horas futuras (con margen de 30 minutos)
            return minutosHora > (minutosActual + 30);
        });
        
        console.log(`⏰ Hoy son las ${horaActualFormateada}. Horarios disponibles hoy:`, horariosDisponibles.length);
    }
    
    // Generar opciones
    let opcionesHTML = '<option value="">Selecciona una hora</option>';
    
    horariosDisponibles.forEach(h => {
        opcionesHTML += `<option value="${h}">${h}</option>`;
    });
    
    select.innerHTML = opcionesHTML;
    
    // Si no hay horarios disponibles para hoy
    if (esHoy && horariosDisponibles.length === 0) {
        select.innerHTML = '<option value="">No hay horarios disponibles para hoy</option>';
        select.disabled = true;
    } else {
        select.disabled = false;
    }
}

function inicializarFecha() {
    const input = document.getElementById('fecha');
    if (!input) return;
    
    const hoy = new Date();
    const hoyFormateado = hoy.toISOString().split('T')[0];
    
    // Establecer fecha mínima como hoy
    input.value = hoyFormateado;
    input.min = hoyFormateado;
    
    // Máximo 30 días en el futuro
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    input.max = maxDate.toISOString().split('T')[0];
    
    console.log("📅 Fecha inicializada. Hoy:", hoyFormateado);
}

// 11. FUNCIONES DE RESERVA
async function reservarTurno() {
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const barberoId = parseInt(document.getElementById('barbero').value);
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;

    // Validaciones básicas
    if (!nombre || !telefono || !barberoId || !fecha || !hora || serviciosSeleccionados.length === 0) {
        mostrarMensaje('Por favor, completa todos los campos y selecciona servicios', 'error');
        return;
    }

    // Validar que la fecha/hora no sea en el pasado
    if (!validarFechaHora(fecha, hora)) {
        mostrarMensaje('No puedes reservar un turno en el pasado. Por favor, selecciona una fecha y hora futuras.', 'error');
        return;
    }

    // Verificar si el barbero sigue disponible
    const barbero = barberos.find(b => b.id === barberoId);
    if (!barbero || !barbero.disponible) {
        mostrarMensaje('El barbero seleccionado ya no está disponible. Por favor, selecciona otro.', 'error');
        cargarSelectBarberos();
        return;
    }

    // Verificar si el turno ya está ocupado
    const ocupado = turnosReservados.some(t => 
        t.barbero_id === barberoId && 
        t.fecha === fecha && 
        t.hora === hora
    );
    
    if (ocupado) {
        mostrarMensaje('Este horario ya está reservado con este barbero.', 'error');
        return;
    }

    // Crear objeto de turno
    const nuevoTurno = {
        cliente: nombre,
        telefono: telefono,
        barbero_id: barberoId,
        barbero_nombre: barbero.nombre,
        servicios: serviciosSeleccionados,
        precio_total: serviciosSeleccionados.reduce((sum, s) => sum + s.precio, 0),
        fecha: fecha,
        hora: hora,
        completado: false
    };

    console.log("📋 Reservando turno:", nuevoTurno);

    // Insertar en Supabase
    const { error } = await _supabase
        .from('turnos')
        .insert([nuevoTurno]);

    if (error) {
        console.error('❌ Error al reservar:', error);
        mostrarMensaje('Error al reservar: ' + error.message, 'error');
    } else {
        mostrarMensaje('✅ ¡Turno reservado exitosamente!', 'exito');
        
        // GUARDAR TELÉFONO EN LOCALSTORAGE
        guardarTelefono(telefono);
        
        limpiarFormulario();
        
        // RECARGAR TURNOS DEL USUARIO
        await cargarTurnosDesdeNube();
        
        // Actualizar info del teléfono
        mostrarInfoTelefono();
    }
}

// 12. FUNCIONES AUXILIARES
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
            mensaje = `No tienes turnos reservados. ¡Reserva tu primer turno!`;
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
    
    // Filtrar turnos pasados para no mostrarlos
    const turnosFuturos = turnosReservados.filter(turno => {
        return validarFechaHora(turno.fecha, turno.hora);
    });
    
    // Si hay turnos pasados, eliminarlos automáticamente
    const turnosPasados = turnosReservados.filter(turno => {
        return !validarFechaHora(turno.fecha, turno.hora);
    });
    
    if (turnosPasados.length > 0) {
        console.log(`🗑️ ${turnosPasados.length} turnos pasados detectados`);
        // Opcional: marcar como completados en la base de datos
        // eliminarTurnosPasados(turnosPasados);
    }
    
    // Mostrar solo turnos futuros
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
    `}).join('');
}

function mostrarInfoTelefono() {
    const telefonoGuardado = obtenerTelefono();
    console.log("ℹ️ Mostrando info para teléfono:", telefonoGuardado);
    
    const infoDiv = document.getElementById('info-telefono');
    const telefonoSpan = document.getElementById('telefono-actual');
    
    if (telefonoGuardado && infoDiv && telefonoSpan) {
        telefonoSpan.textContent = telefonoGuardado;
        infoDiv.style.display = 'block';
        
        // Configurar botón para cambiar teléfono
        const cambiarBtn = document.getElementById('cambiar-telefono');
        if (cambiarBtn) {
            // Remover event listeners previos
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
                <p>No hay barberos disponibles</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = barberos.map(b => `
        <div class="barbero-card ${b.disponible ? 'barbero-disponible' : 'barbero-no-disponible'}">
            <div class="barbero-header">
                <div class="barbero-nombre">${b.nombre}</div>
                <div class="estado ${b.disponible ? 'estado-disponible' : 'estado-no-disponible'}">
                    ${b.disponible ? 'DISPONIBLE' : 'NO DISPONIBLE'}
                </div>
            </div>
            <div class="barbero-info">
                <p><strong>Especialidad:</strong> ${b.especialidad}</p>
                ${b.telefono ? `<p><strong>Teléfono:</strong> ${b.telefono}</p>` : ''}
                ${b.email ? `<p><strong>Email:</strong> ${b.email}</p>` : ''}
            </div>
        </div>
    `).join('');
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
    const fecha = new Date(f + 'T00:00:00');
    return fecha.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });
}

function limpiarFormulario() {
    document.getElementById('nombre').value = '';
    // NO limpiamos el teléfono para mantener la persistencia
    document.getElementById('barbero').selectedIndex = 0;
    document.getElementById('hora').selectedIndex = 0;
    
    // Limpiar checkboxes
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
    
    // Botón de reserva
    const reservarBtn = document.getElementById('reservar-btn');
    if (reservarBtn) {
        reservarBtn.addEventListener('click', reservarTurno);
    }
    
    // Enlaces admin
    ['admin-link', 'admin-link-mobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', function(e) {
                e.preventDefault();
                solicitarPasswordAdmin();
            });
        }
    });
    
    // Menú móvil
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
    
    // Cargar turnos cuando el usuario escriba su teléfono
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
    
    // Botón para buscar turnos manualmente
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
    
    // Actualizar horarios cuando cambie la fecha
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.addEventListener('change', function() {
            console.log("📅 Fecha cambiada a:", this.value);
            cargarHorarios();
        });
    }
    
    // Eventos del calendario
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => cambiarMes('prev'));
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => cambiarMes('next'));
    }
}

function solicitarPasswordAdmin() {
    const password = prompt("Contraseña de administrador:");
    if (password === "admin123") {
        window.location.href = "admin.html";
    } else if (password !== null) {
        alert("Contraseña incorrecta");
    }
}

// 13. LIMPIAR SUSCRIPCIONES AL SALIR
window.addEventListener('beforeunload', function() {
    if (canalBarberos) {
        _supabase.removeChannel(canalBarberos);
    }
});

console.log("✅ script.js cargado correctamente");