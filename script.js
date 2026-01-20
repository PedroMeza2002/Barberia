// ============================================
// SCRIPT.JS - Página Principal Actualizada
// ============================================

// 1. DATOS INICIALES
let barberos = []; // Se llenará desde Supabase

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

// 3. INICIALIZACIÓN MEJORADA
document.addEventListener('DOMContentLoaded', async function () {
    console.log("Inicializando página principal...");
    
    // Cargar barberos desde Supabase primero
    await cargarBarberosDesdeNube();
    
    // Luego inicializar el resto
    cargarSelectBarberos();
    inicializarFecha();
    cargarHorarios();
    cargarCheckboxServicios();
    
    // Cargar turnos
    await cargarTurnosDesdeNube();
    
    // Configurar suscripciones en tiempo real
    configurarSuscripcionesRealtime();
    
    // Configurar eventos
    configurarEventos();
    
    console.log("Página inicializada correctamente");
});

// 4. FUNCIONES DE CARGA DE BARBEROS (ACTUALIZADAS)
async function cargarBarberosDesdeNube() {
    console.log("Cargando barberos desde Supabase...");
    
    try {
        const { data: barberosDB, error } = await _supabase
            .from('barberos')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('Error cargando barberos:', error);
            mostrarMensaje('Error al cargar barberos', 'error');
            return;
        }
        
        console.log("Barberos recibidos:", barberosDB);
        
        // Procesar y guardar barberos
        barberos = barberosDB.map(b => ({
            id: b.id,
            nombre: b.nombre || "Sin nombre",
            especialidad: b.especialidad || "Corte y barba",
            disponible: b.activo !== false, // Convertir 'activo' a 'disponible'
            telefono: b.telefono || "",
            email: b.email || ""
        }));
        
        // Renderizar barberos
        renderizarBarberos();
        
        // Actualizar contador
        actualizarContadorDisponibles();
        
    } catch (error) {
        console.error("Error en cargarBarberosDesdeNube:", error);
        mostrarMensaje("Error al cargar barberos", "error");
    }
}

function renderizarBarberos() {
    const container = document.getElementById('barberos-container');
    if (!container) {
        console.error("No se encontró el contenedor de barberos");
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

// 5. SUSCRIPCIONES EN TIEMPO REAL
function configurarSuscripcionesRealtime() {
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
                console.log('Cambio en barbero detectado:', payload);
                actualizarBarberoIndividual(payload.new);
            }
        )
        .subscribe((status) => {
            console.log('Estado suscripción barberos:', status);
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
            () => {
                console.log('Cambio en turnos detectado');
                cargarTurnosDesdeNube();
            }
        )
        .subscribe();
}

function actualizarBarberoIndividual(barberoNuevo) {
    // Buscar y actualizar en el array local
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
        
        // Actualizar UI específica de ese barbero
        actualizarBarberoEnUI(barberos[index]);
        
        // Actualizar select si es necesario
        actualizarSelectBarberos();
        
        // Actualizar contador
        actualizarContadorDisponibles();
        
        console.log("Barbero actualizado en tiempo real:", barberos[index]);
    }
}

function actualizarBarberoEnUI(barbero) {
    const barberoCards = document.querySelectorAll('.barbero-card');
    
    barberoCards.forEach(card => {
        const nombreElement = card.querySelector('.barbero-nombre');
        if (nombreElement && nombreElement.textContent === barbero.nombre) {
            // Actualizar estado
            const estadoElement = card.querySelector('.estado');
            if (estadoElement) {
                estadoElement.textContent = barbero.disponible ? 'DISPONIBLE' : 'NO DISPONIBLE';
                estadoElement.className = barbero.disponible ? 'estado estado-disponible' : 'estado estado-no-disponible';
            }
            
            // Actualizar clases del card
            card.className = `barbero-card ${barbero.disponible ? 'barbero-disponible' : 'barbero-no-disponible'}`;
        }
    });
}

// 6. FUNCIONES DE CARGA DE DATOS (EXISTENTES - ACTUALIZADAS)
function cargarSelectBarberos() {
    const select = document.getElementById('barbero');
    if (!select) return;
    
    // Guardar selección actual
    const valorActual = select.value;
    
    // Limpiar opciones
    select.innerHTML = '<option value="">Selecciona un barbero</option>';
    
    // Agregar solo barberos disponibles
    barberos.forEach(b => {
        if (b.disponible) {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = `${b.nombre} - ${b.especialidad}`;
            option.dataset.disponible = b.disponible;
            select.appendChild(option);
        }
    });
    
    // Restaurar selección si sigue disponible
    if (valorActual && [...select.options].some(opt => opt.value === valorActual)) {
        select.value = valorActual;
    }
}

async function cargarTurnosDesdeNube() {
    try {
        const { data, error } = await _supabase
            .from('turnos')
            .select('*')
            .eq('completado', false)
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });

        if (error) {
            console.error('Error cargando turnos:', error);
            mostrarMensaje('Error al cargar turnos', 'error');
            return;
        }

        turnosReservados = data || [];
        renderizarTurnos();
        
    } catch (error) {
        console.error("Error en cargarTurnosDesdeNube:", error);
    }
}

// 7. FUNCIONES DE RESERVA (EXISTENTES - ACTUALIZADAS)
async function reservarTurno() {
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const barberoId = parseInt(document.getElementById('barbero').value);
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;

    // Validaciones
    if (!nombre || !telefono || !barberoId || !fecha || !hora || serviciosSeleccionados.length === 0) {
        mostrarMensaje('Por favor, completa todos los campos y selecciona servicios', 'error');
        return;
    }

    // Verificar si el barbero sigue disponible
    const barbero = barberos.find(b => b.id === barberoId);
    if (!barbero || !barbero.disponible) {
        mostrarMensaje('El barbero seleccionado ya no está disponible. Por favor, selecciona otro.', 'error');
        cargarSelectBarberos(); // Recargar select
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

    console.log("Reservando turno:", nuevoTurno);

    // Insertar en Supabase
    const { error } = await _supabase
        .from('turnos')
        .insert([nuevoTurno]);

    if (error) {
        console.error('Error al reservar:', error);
        mostrarMensaje('Error al reservar: ' + error.message, 'error');
    } else {
        mostrarMensaje('¡Turno reservado exitosamente!', 'exito');
        limpiarFormulario();
        // No necesitamos recargar manualmente, la suscripción lo hará
    }
}

// 8. FUNCIONES AUXILIARES (EXISTENTES)
function renderizarTurnos() {
    const container = document.getElementById('turnos-container');
    if (!container) return;
    
    if (turnosReservados.length === 0) {
        container.innerHTML = `
            <div class="sin-turnos">
                <i class="fas fa-calendar-times"></i>
                <p>No tienes turnos reservados.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = turnosReservados.map(turno => `
        <div class="turno-card">
            <div class="turno-info">
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
            <button class="btn-danger" onclick="cancelarTurnoNube(${turno.id})">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `).join('');
}

window.cancelarTurnoNube = async function(id) {
    if (!confirm('¿Estás seguro de que quieres cancelar este turno?')) {
        return;
    }
    
    try {
        const { error } = await _supabase
            .from('turnos')
            .update({ completado: true })
            .eq('id', id);

        if (error) {
            console.error("Error al cancelar:", error);
            mostrarMensaje("Error al cancelar: " + error.message, "error");
        } else {
            mostrarMensaje("Turno cancelado exitosamente", "exito");
        }
    } catch (error) {
        console.error("Error en cancelarTurnoNube:", error);
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
    
    select.innerHTML = '<option value="">Selecciona una hora</option>' + 
        generarHorarios().map(h => `<option value="${h}">${h}</option>`).join('');
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

    // Event listeners para checkboxes
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

function inicializarFecha() {
    const input = document.getElementById('fecha');
    if (!input) return;
    
    const hoy = new Date().toISOString().split('T')[0];
    input.value = hoy;
    input.min = hoy;
    
    // Máximo 30 días en el futuro
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    input.max = maxDate.toISOString().split('T')[0];
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
    document.getElementById('telefono').value = '';
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
}

function solicitarPasswordAdmin() {
    const password = prompt("Contraseña de administrador:");
    if (password === "admin123") {
        window.location.href = "admin.html";
    } else if (password !== null) {
        alert("Contraseña incorrecta");
    }
}

// 9. LIMPIAR SUSCRIPCIONES AL SALIR
window.addEventListener('beforeunload', function() {
    if (canalBarberos) {
        _supabase.removeChannel(canalBarberos);
    }
});

console.log("script.js cargado correctamente");