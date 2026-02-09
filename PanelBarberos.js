// ============================================
// PANELBARBEROS.JS - Sistema de Calificaciones Sincronizado
// ============================================
const db = window.db;


// Variables de estado global
let turnosReservados = [];
let barberos = [];
let mapaCalificacionesClientes = {}; // Mapa: teléfono -> calificación

// 2. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando panel de barberos...");
    
    // Cargar datos iniciales
    cargarDatosIniciales();
    
    // Configurar eventos
    configurarEventos();
});

// 3. CARGAR DATOS INICIALES
async function cargarDatosIniciales() {
    try {
        console.log("Cargando datos iniciales...");
        
        // Cargar barberos primero
        await cargarBarberos();
        
        // Cargar turnos después
        await cargarTurnos();
        
        console.log("Datos cargados exitosamente");
        
    } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        mostrarNotificacion("Error al cargar datos", "error");
    }
}

// 4. CARGAR BARBEROS
async function cargarBarberos() {
    try {
        const { data: barberosDB, error } = await db
            .from('barberos')
            .select('*')
            .order('nombre', { ascending: true });
        
        if (error) {
            console.error("Error al cargar barberos:", error);
            return;
        }
        
        barberos = barberosDB || [];
        actualizarSelectBarberos();
        
    } catch (error) {
        console.error("Error en cargarBarberos:", error);
    }
}

function actualizarSelectBarberos() {
    const select = document.getElementById('filtro-barbero-panel');
    if (!select) return;
    
    // Limpiar opciones excepto la primera
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Añadir barberos
    barberos.forEach(barbero => {
        if (barbero.activo !== false) {
            const option = document.createElement('option');
            option.value = barbero.id;
            option.textContent = barbero.nombre;
            select.appendChild(option);
        }
    });
}

// 5. CARGAR TURNOS Y CALIFICACIONES DE CLIENTES
async function cargarTurnos() {
    try {
        const { data, error } = await db
            .from('turnos')
            .select('*')
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });

        if (error) {
            console.error('Error cargando turnos:', error);
            mostrarNotificacion('Error al cargar turnos', 'error');
            return;
        }

        turnosReservados = data || [];
        
        // Cargar calificaciones de clientes
        await cargarCalificacionesClientes();
        
        // Aplicar calificaciones a los turnos
        aplicarCalificacionesATurnos();
        
        renderizarTurnos();
        
    } catch (error) {
        console.error("Error en cargarTurnos:", error);
    }
}

// 5.1 CARGAR CALIFICACIONES DE CLIENTES
async function cargarCalificacionesClientes() {
    try {
        // Obtener teléfonos únicos de todos los turnos
        const telefonos = [...new Set(
            turnosReservados
                .map(t => t.telefono)
                .filter(t => t && t.trim() !== '')
        )];

        if (telefonos.length === 0) {
            mapaCalificacionesClientes = {};
            return;
        }

        // Cargar calificaciones desde la nueva tabla
        const { data, error } = await db
            .from('clientes_calificaciones')
            .select('telefono_cliente, calificacion')
            .in('telefono_cliente', telefonos);

        if (error) {
            console.error("Error cargando calificaciones de clientes:", error);
            mapaCalificacionesClientes = {};
            return;
        }

        // Crear mapa de calificaciones
        mapaCalificacionesClientes = {};
        data.forEach(item => {
            mapaCalificacionesClientes[item.telefono_cliente] = item.calificacion;
        });
        
        console.log("Calificaciones cargadas:", mapaCalificacionesClientes);
        
    } catch (error) {
        console.error("Error en cargarCalificacionesClientes:", error);
        mapaCalificacionesClientes = {};
    }
}

// 5.2 APLICAR CALIFICACIONES A TURNOS
function aplicarCalificacionesATurnos() {
    turnosReservados.forEach(turno => {
        const telefono = turno.telefono;
        
        // Si el turno no tiene calificación pero el cliente sí tiene en el mapa
        if (telefono && !turno.calificacion && mapaCalificacionesClientes[telefono]) {
            turno.calificacion = mapaCalificacionesClientes[telefono];
        }
        
        // Si el turno tiene calificación, actualizar el mapa (por si acaso)
        if (telefono && turno.calificacion) {
            mapaCalificacionesClientes[telefono] = turno.calificacion;
        }
    });
}

// 6. RENDERIZAR TURNOS
function renderizarTurnos() {
    const container = document.getElementById('turnos-panel-container');
    if (!container) {
        console.error("ERROR: No se encontró #turnos-panel-container");
        return;
    }

    // Obtener filtros
    const fFecha = document.getElementById('filtro-fecha-panel')?.value;
    const fBarbero = document.getElementById('filtro-barbero-panel')?.value;
    const fEstado = document.getElementById('filtro-estado-panel')?.value;

    // Aplicar filtros
    let filtrados = turnosReservados.filter(t => {
        const matchFecha = !fFecha || t.fecha === fFecha;
        const matchBarbero = !fBarbero || t.barbero_id == fBarbero;
        const matchEstado = !fEstado || 
                           (fEstado === 'pendiente' && !t.completado) || 
                           (fEstado === 'completado' && t.completado);
        return matchFecha && matchBarbero && matchEstado;
    });

    // Mostrar mensaje si no hay resultados
    if (filtrados.length === 0) {
        container.innerHTML = `
            <div class="sin-turnos" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 15px; color: #d4af37;"></i>
                <p>No hay turnos con esos filtros</p>
                <p class="subtitulo">Intenta con otros criterios de búsqueda</p>
            </div>
        `;
        return;
    }

    // Generar HTML de los turnos
    let html = '';
    
    filtrados.forEach(turno => {
        const barbero = barberos.find(b => b.id == turno.barbero_id);
        const barberoNombre = barbero ? barbero.nombre : `ID: ${turno.barbero_id}`;
        
        const servicios = Array.isArray(turno.servicios) ? 
            turno.servicios.map(s => s.nombre).join(', ') : 
            (turno.servicios || 'Servicio no especificado');
        
        const estadoColor = turno.completado ? '#28a745' : '#dc3545';
        const estadoTexto = turno.completado ? 'Completado' : 'Pendiente';
        
        // Calificación (usar la del cliente si el turno no tiene)
        const calificacionTurno = turno.calificacion || 0;
        const calificacionCliente = mapaCalificacionesClientes[turno.telefono] || 0;
        const calificacionFinal = calificacionTurno || calificacionCliente;
        
        const calificacionHTML = generarHTMLCalificacion(turno, calificacionFinal);
        
        html += `
            <div class="turno-card">
                <div class="turno-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <h3 style="margin: 0 0 5px 0; color: #333; font-size: 1.1rem;">${turno.cliente || 'Cliente'}</h3>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">
                            <i class="fas fa-phone" style="margin-right: 5px;"></i>${turno.telefono || 'No registrado'}
                            ${mapaCalificacionesClientes[turno.telefono] ? 
                                `<span style="margin-left: 10px; font-size: 0.8rem; color: #ffc107;">
                                    <i class="fas fa-star"></i> Cliente: ${mapaCalificacionesClientes[turno.telefono]}/5
                                </span>` : ''
                            }
                        </p>
                    </div>
                    <span style="background: ${estadoColor}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">
                        ${estadoTexto}
                    </span>
                </div>
                
                <div class="turno-info" style="font-size: 0.9rem; color: #555;">
                    <p style="margin: 5px 0;"><strong>Barbero:</strong> ${barberoNombre}</p>
                    <p style="margin: 5px 0;"><strong>Servicios:</strong> ${servicios}</p>
                    <p style="margin: 5px 0;"><strong>Fecha:</strong> ${formatearFecha(turno.fecha)}</p>
                    <p style="margin: 5px 0;"><strong>Hora:</strong> ${turno.hora} hs</p>
                    <p style="margin: 5px 0;"><strong>Precio:</strong> ${(turno.precio_total || 0).toLocaleString('es-PY')} Gs</p>
                </div>
                
                <div class="turno-calificacion" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <p style="margin: 0 0 5px 0; font-weight: 500; color: #333; font-size: 0.9rem;">
                        Calificación del cliente:
                    </p>
                    ${calificacionHTML}
                </div>
                
                ${!turno.completado ? `
                    <div class="turno-acciones" style="margin-top: 15px;">
                        <button onclick="marcarCompletado(${turno.id})" class="btn-completar">
                            <i class="fas fa-check-circle"></i> Marcar como Completado
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 7. FUNCIÓN PARA GENERAR CALIFICACIÓN EN HTML
function generarHTMLCalificacion(turno, calificacion) {
    const { completado, id, telefono } = turno;
    
    // Si no tiene calificación
    if (!calificacion || calificacion < 1) {
        if (completado) {
            return `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="sin-calificar">Sin calificar</span>
                    <button onclick="mostrarModalCalificar(${id}, '${telefono || ''}', 0)" 
                            class="btn-calificar">
                        <i class="fas fa-star"></i> Calificar
                    </button>
                </div>
            `;
        } else {
            return `<span class="sin-calificar">(Pendiente de servicio)</span>`;
        }
    }
    
    // Si ya tiene calificación
    let estrellas = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= calificacion) {
            estrellas += '<i class="fas fa-star"></i>';
        } else {
            estrellas += '<i class="far fa-star"></i>';
        }
    }
    
    // Determinar si es calificación del turno o del cliente
    const esCalificacionCliente = mapaCalificacionesClientes[telefono] === calificacion && !turno.calificacion;
    
    return `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
                <div class="calificacion-estrellas">
                    ${estrellas}
                    <span style="margin-left: 5px; font-weight: 500;">${calificacion}/5</span>
                </div>
                ${esCalificacionCliente ? 
                    `<small style="color: #666; font-size: 0.8rem; display: block;">
                        <i class="fas fa-sync-alt"></i> Calificación del cliente aplicada
                    </small>` : ''
                }
            </div>
            ${completado ? `
                <button onclick="mostrarModalCalificar(${id}, '${telefono || ''}', ${calificacion})" 
                        class="btn-calificar">
                    <i class="fas fa-edit"></i> ${esCalificacionCliente ? 'Calificar' : 'Cambiar'}
                </button>
            ` : ''}
        </div>
    `;
}

// 8. MODAL DE CALIFICACIÓN
function mostrarModalCalificar(turnoId, telefono, calificacionActual = 0) {
    const telefonoTexto = telefono ? telefono : 'No registrado';
    
    // Obtener calificación del cliente si existe
    const calificacionCliente = mapaCalificacionesClientes[telefono] || 0;
    const tieneCalificacionCliente = calificacionCliente > 0;
    
    const modalHTML = `
        <div class="modal-overlay" id="modal-calificar" style="
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            padding: 20px;
        ">
            <div class="modal-content" style="
                background: white;
                border-radius: 10px;
                max-width: 450px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            ">
                <div class="modal-header" style="
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #2d2d2d;
                    color: white;
                    border-radius: 10px 10px 0 0;
                ">
                    <h3 style="margin: 0; font-size: 1.2rem;">
                        <i class="fas fa-star" style="color: #ffc107; margin-right: 10px;"></i>
                        Calificar Cliente
                    </h3>
                    <button onclick="cerrarModalCalificar()" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        color: white;
                        cursor: pointer;
                        padding: 5px;
                    ">&times;</button>
                </div>
                
                <div class="modal-body" style="padding: 20px;">
                    <p style="margin-bottom: 10px; color: #666;">Teléfono del cliente:</p>
                    <p style="margin-bottom: 20px; font-weight: 600; background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">
                        ${telefonoTexto}
                    </p>
                    
                    ${tieneCalificacionCliente ? `
                        <div style="background: #e8f5e9; padding: 10px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #4CAF50;">
                            <p style="margin: 0; font-size: 0.9rem; color: #2e7d32;">
                                <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                                Este cliente ya tiene una calificación: <strong>${calificacionCliente}/5</strong>
                            </p>
                        </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <p style="margin-bottom: 15px; font-weight: 500; color: #333;">Selecciona una calificación:</p>
                        
                        <div id="estrellas-calificacion" style="font-size: 2rem; color: #ddd; margin-bottom: 10px;">
                            <span class="estrella-cal" data-value="1" style="cursor: pointer; margin: 0 5px;">☆</span>
                            <span class="estrella-cal" data-value="2" style="cursor: pointer; margin: 0 5px;">☆</span>
                            <span class="estrella-cal" data-value="3" style="cursor: pointer; margin: 0 5px;">☆</span>
                            <span class="estrella-cal" data-value="4" style="cursor: pointer; margin: 0 5px;">☆</span>
                            <span class="estrella-cal" data-value="5" style="cursor: pointer; margin: 0 5px;">☆</span>
                        </div>
                        
                        <p id="texto-calificacion" style="font-size: 1rem; font-weight: 500; color: #333; min-height: 24px;">
                            ${calificacionActual ? `Actual: ${calificacionActual}/5` : 'Elige de 1 a 5 estrellas'}
                        </p>
                    </div>
                    
                    <div style="background: #f0f8ff; padding: 12px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #007bff;">
                        <p style="margin: 0; font-size: 0.85rem; color: #0066cc;">
                            <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                            Esta calificación se aplicará a este turno y se guardará para todos los turnos futuros de este cliente.
                        </p>
                    </div>
                </div>
                
                <div class="modal-footer" style="
                    padding: 20px;
                    border-top: 1px solid #eee;
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                ">
                    <button onclick="cerrarModalCalificar()" style="
                        padding: 8px 16px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">Cancelar</button>
                    <button onclick="guardarCalificacion(${turnoId})" id="btn-guardar-calificacion" style="
                        padding: 8px 16px;
                        background: #d4af37;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        font-weight: 500;
                    " ${calificacionActual ? '' : 'disabled'}>
                        ${calificacionActual ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente si hay
    const modalExistente = document.getElementById('modal-calificar');
    if (modalExistente) modalExistente.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Inicializar estrellas
    inicializarEstrellasCalificacion(calificacionActual);
}

function inicializarEstrellasCalificacion(calificacionActual = 0) {
    const estrellas = document.querySelectorAll('.estrella-cal');
    
    // Inicializar variable global
    window.calificacionSeleccionada = calificacionActual;
    
    // Función para actualizar estrellas
    function actualizarEstrellas(valor) {
        estrellas.forEach(estrella => {
            const estrellavalue = parseInt(estrella.getAttribute('data-value'));
            if (estrellavalue <= valor) {
                estrella.textContent = '★';
                estrella.style.color = '#ffc107';
            } else {
                estrella.textContent = '☆';
                estrella.style.color = '#ddd';
            }
        });
        
        // Actualizar texto
        const textoCalificacion = document.getElementById('texto-calificacion');
        if (textoCalificacion) {
            if (valor > 0) {
                textoCalificacion.textContent = `Seleccionado: ${valor}/5`;
            } else if (calificacionActual > 0) {
                textoCalificacion.textContent = `Actual: ${calificacionActual}/5`;
            }
        }
    }
    
    // Establecer estado inicial
    if (calificacionActual > 0) {
        actualizarEstrellas(calificacionActual);
        
        // Habilitar botón si ya hay calificación
        const btnGuardar = document.getElementById('btn-guardar-calificacion');
        if (btnGuardar) {
            btnGuardar.disabled = false;
        }
    }
    
    // Agregar eventos a las estrellas
    estrellas.forEach(estrella => {
        estrella.addEventListener('click', function() {
            const valor = parseInt(this.getAttribute('data-value'));
            window.calificacionSeleccionada = valor;
            
            actualizarEstrellas(valor);
            
            // Habilitar botón guardar
            const btnGuardar = document.getElementById('btn-guardar-calificacion');
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.textContent = calificacionActual ? 'Actualizar' : 'Guardar';
            }
        });
    });
}

function cerrarModalCalificar() {
    const modal = document.getElementById('modal-calificar');
    if (modal) modal.remove();
}

// 9. GUARDAR CALIFICACIÓN - SISTEMA SINCRONIZADO
async function guardarCalificacion(turnoId) {
    try {
        // Obtener la calificación seleccionada
        const calificacion = window.calificacionSeleccionada;

        // Validar calificación
        if (!calificacion || calificacion < 1 || calificacion > 5) {
            mostrarNotificacion('Selecciona una calificación válida (1-5 estrellas)', 'error');
            return;
        }

        // Obtener el turno
        const turno = turnosReservados.find(t => t.id === turnoId);
        const telefono = turno?.telefono;

        if (!telefono) {
            mostrarNotificacion('El turno no tiene teléfono asociado', 'error');
            return;
        }

        console.log("Guardando calificación:", calificacion, "para cliente:", telefono);

        // 1️⃣ Guardar calificación en TURNOS (para este turno específico)
        const { error: errorTurno } = await db
            .from('turnos')
            .update({ 
                calificacion: calificacion
            })
            .eq('id', turnoId);

        if (errorTurno) {
            console.error("Error al guardar en turnos:", errorTurno);
            throw new Error(`Error en turnos: ${errorTurno.message}`);
        }

        // 2️⃣ Guardar/Actualizar calificación del CLIENTE (para todos sus turnos)
        const { error: errorCliente } = await db
            .from('clientes_calificaciones')
            .upsert({
                telefono_cliente: telefono,
                calificacion: calificacion,
                fecha_ultima_calificacion: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'telefono_cliente'
            });

        if (errorCliente) {
            console.error("Error al guardar calificación del cliente:", errorCliente);
            // No lanzamos error, porque al menos se guardó en el turno
        }

        // 3️⃣ Actualizar estado local
        if (turno) {
            turno.calificacion = calificacion;
        }
        
        // Actualizar el mapa de calificaciones
        mapaCalificacionesClientes[telefono] = calificacion;
        
        // 4️⃣ Aplicar calificación a otros turnos del mismo cliente
        turnosReservados.forEach(t => {
            if (t.telefono === telefono && t.id !== turnoId && !t.calificacion) {
                t.calificacion = calificacion;
            }
        });

        // 5️⃣ Cerrar modal y notificar
        cerrarModalCalificar();
        
        // 6️⃣ Actualizar la vista
        renderizarTurnos();
        
        mostrarNotificacion(`¡Calificación ${calificacion} ⭐ guardada para este cliente!`, 'exito');
        
        // 7️⃣ Recargar datos para asegurar consistencia
        setTimeout(() => {
            cargarTurnos();
        }, 500);

    } catch (error) {
        console.error('Error al guardar calificación:', error);
        mostrarNotificacion('Error al guardar calificación', 'error');
    }
}

// 10. MARCAR COMO COMPLETADO
async function marcarCompletado(id) {
    if (!confirm("¿Marcar este turno como completado?")) {
        return;
    }
    
    try {
        const { error } = await db
            .from('turnos')
            .update({ completado: true })
            .eq('id', id);

        if (error) {
            console.error("Error al completar turno:", error);
            mostrarNotificacion("Error al actualizar el turno", "error");
        } else {
            mostrarNotificacion("¡Turno marcado como completado!", "exito");
            // Recargar turnos
            await cargarTurnos();
        }
    } catch (error) {
        console.error("Error en marcarCompletado:", error);
        mostrarNotificacion("Error al completar turno", "error");
    }
}

// 11. FUNCIONES AUXILIARES
function formatearFecha(fechaISO) {
    if (!fechaISO) return 'Sin fecha';
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia}/${mes}/${anio}`;
}

function configurarEventos() {
    // Eventos de filtros
    const filtros = ['filtro-fecha-panel', 'filtro-barbero-panel', 'filtro-estado-panel'];
    filtros.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                setTimeout(() => renderizarTurnos(), 300);
            });
        }
    });

    // Botón limpiar filtros
    const limpiarBtn = document.getElementById('limpiar-filtros-panel');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', () => {
            filtros.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            renderizarTurnos();
        });
    }
}

function mostrarNotificacion(texto, tipo) {
    let notif = document.getElementById('notificacion-panel');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'notificacion-panel';
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            max-width: 300px;
        `;
        document.body.appendChild(notif);
    }
    
    notif.textContent = texto;
    
    // Estilos según tipo
    if (tipo === 'exito') {
        notif.style.background = '#4CAF50';
    } else if (tipo === 'error') {
        notif.style.background = '#f44336';
    } else {
        notif.style.background = '#2196F3';
    }
    
    notif.style.display = 'block';
    
    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

// 12. HACER FUNCIONES DISPONIBLES GLOBALMENTE
window.mostrarModalCalificar = mostrarModalCalificar;
window.cerrarModalCalificar = cerrarModalCalificar;
window.guardarCalificacion = guardarCalificacion;
window.marcarCompletado = marcarCompletado;

console.log("PanelBarberos.js cargado correctamente");

// ================================
// CERRAR SESIÓN
// ================================
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async () => {
        const confirmar = confirm('¿Querés cerrar sesión?');
        if (!confirmar) return;

        const { error } = await window.db.auth.signOut();

        if (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Error al cerrar sesión');
            return;
        }

        // Redirigir al login
        window.location.href = 'login.html';
    });
});
