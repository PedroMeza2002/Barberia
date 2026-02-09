// ============================================
// ADMIN.JS - Sistema de Gestión de Barbería (ACTUALIZADO)
// ============================================


// Variables de estado global
let turnosReservados = [];
let barberos = [];

// 2. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando sistema administrativo...");
    
    
    
    // Cargar datos iniciales
    cargarDatosIniciales();
    
    // Configurar eventos
    configurarEventos();
    
});

// 3. FUNCIONES DE CARGA DE DATOS
async function cargarDatosIniciales() {
    try {
        console.log("Cargando datos iniciales...");
        
        // Cargar barberos primero
        await cargarBarberosDesdeSupabase();
        
        // Cargar turnos después
        await cargarTurnosAdmin();
        
        console.log("Datos cargados exitosamente");
    } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        mostrarNotificacion("Error al cargar datos", "error");
    }
}

// 4. CARGA DE BARBEROS DESDE SUPABASE
async function cargarBarberosDesdeSupabase() {
    console.log("Cargando barberos desde Supabase...");
    
    try {
        const { data: barberosDB, error } = await db
            .from('barberos')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error("Error al cargar barberos:", error);
            mostrarNotificacion("Error al cargar barberos", "error");
            return;
        }
        
        console.log("Barberos recibidos de Supabase:", barberosDB);
        
        // Procesar barberos para manejar valores nulos
        barberos = barberosDB.map(barbero => ({
            id: barbero.id,
            nombre: barbero.nombre || "Sin nombre",
            especialidad: barbero.especialidad || "Sin especialidad",
            activo: barbero.activo !== false,
            telefono: barbero.telefono || "No registrado",
            email: barbero.email || "No registrado",
            horario: barbero.horario || "Horario no definido",
            created_at: barbero.created_at || new Date().toISOString()
        }));
        
        console.log(`Barberos procesados: ${barberos.length}`);
        
        // Renderizar barberos y actualizar select de filtros
        renderizarBarberosAdmin();
        actualizarSelectBarberos();
        
    } catch (error) {
        console.error("Error en cargarBarberosDesdeSupabase:", error);
    }
}

// 5. RENDERIZADO DE BARBEROS EN LA INTERFAZ
function renderizarBarberosAdmin() {
    const container = document.getElementById('barberos-admin-container');
    if (!container) {
        console.error("ERROR: No se encontró #barberos-admin-container");
        return;
    }
    
    console.log("Renderizando barberos...");
    
    if (barberos.length === 0) {
        container.innerHTML = `
            <div class="sin-turnos">
                <i class="fas fa-user-slash"></i>
                <p>No hay barberos registrados</p>
                <button class="btn-primary" onclick="mostrarModalNuevoBarbero()">
                    <i class="fas fa-plus"></i> Agregar Primer Barbero
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    barberos.forEach(barbero => {
        const telefono = barbero.telefono === "No registrado" ? 
            '<span style="color: #999;">No registrado</span>' : 
            barbero.telefono;
            
        const email = barbero.email === "No registrado" ? 
            '<span style="color: #999;">No registrado</span>' : 
            barbero.email;
        
        html += `
            <div class="barbero-card ${!barbero.activo ? 'barbero-no-disponible' : 'barbero-disponible'}" style="opacity: ${barbero.activo ? '1' : '0.7'};">
                <div class="barbero-header">
                    <div class="barbero-nombre">${barbero.nombre}</div>
                    <div class="estado ${barbero.activo ? 'estado-disponible' : 'estado-no-disponible'}">
                        ${barbero.activo ? 'Activo' : 'Inactivo'}
                    </div>
                </div>
                
                <div class="barbero-info">
                    <p><strong>Especialidad:</strong> ${barbero.especialidad}</p>
                    
                    <div class="turno-detalle">
                        <i class="fas fa-phone"></i>
                        <span>${telefono}</span>
                    </div>
                    
                    <div class="turno-detalle">
                        <i class="fas fa-envelope"></i>
                        <span>${email}</span>
                    </div>
                    
                    <div class="turno-detalle">
                        <i class="fas fa-clock"></i>
                        <span><strong>Horario:</strong> ${barbero.horario}</span>
                    </div>
                </div>
                
                <div class="barbero-acciones" style="padding: 15px; border-top: 1px solid #eee; display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                    <button class="btn-secundario" onclick="toggleActivoBarbero(${barbero.id})" style="padding: 8px 15px;">
                        <i class="fas fa-power-off"></i> ${barbero.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="btn-editar" onclick="editarBarbero(${barbero.id})" style="padding: 8px 15px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-danger" onclick="eliminarBarbero(${barbero.id})" style="padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    // Añadir botón para nuevo barbero
    html += `
        <div class="barbero-card" style="text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed #d4af37; min-height: 200px;">
            <i class="fas fa-user-plus" style="font-size: 2.5rem; color: #d4af37; margin-bottom: 15px;"></i>
            <p style="margin-bottom: 20px; color: #666;">Agregar nuevo barbero</p>
            <button class="btn-primary" onclick="mostrarModalNuevoBarbero()" style="max-width: 200px; padding: 10px 20px;">
                <i class="fas fa-plus"></i> Nuevo Barbero
            </button>
        </div>
    `;
    
    container.innerHTML = html;
}

function actualizarSelectBarberos() {
    const select = document.getElementById('filtro-barbero');
    if (!select) return;
    
    // Guardar el valor seleccionado actual
    const valorActual = select.value;
    
    // Limpiar opciones excepto la primera
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Añadir barberos
    barberos.forEach(barbero => {
        if (barbero.activo) {
            const option = document.createElement('option');
            option.value = barbero.id;
            option.textContent = barbero.nombre;
            select.appendChild(option);
        }
    });
    
    // Restaurar el valor seleccionado si existe
    if (valorActual && [...select.options].some(opt => opt.value === valorActual)) {
        select.value = valorActual;
    }
}

// 6. FUNCIONES PARA FORMATEAR FECHAS
function formatearFechaAdmin(fechaISO) {
    if (!fechaISO) return 'Sin fecha';
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia}/${mes}/${anio}`;
}

function convertirFechaAdmin(fechaDDMMYYYY) {
    if (!fechaDDMMYYYY) return null;
    const [dia, mes, anio] = fechaDDMMYYYY.split('/');
    return `${anio}-${mes}-${dia}`;
}

// 7. FUNCIONES CRUD PARA BARBEROS
async function toggleActivoBarbero(id) {
    const barbero = barberos.find(b => b.id === id);
    if (!barbero) return;
    
    const nuevoEstado = !barbero.activo;
    
    console.log(`Cambiando estado del barbero ${id} a ${nuevoEstado}`);
    
    try {
        const { error } = await db
            .from('barberos')
            .update({ activo: nuevoEstado })
            .eq('id', id);
        
        if (error) {
            console.error("Error al actualizar barbero:", error);
            mostrarNotificacion('Error al actualizar estado', 'error');
            return;
        }
        
        // Actualizar localmente
        barbero.activo = nuevoEstado;
        
        // Recargar la interfaz
        renderizarBarberosAdmin();
        actualizarSelectBarberos();
        mostrarNotificacion(
            `Barbero ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
            'exito'
        );
        
    } catch (error) {
        console.error("Error en toggleActivoBarbero:", error);
        mostrarNotificacion('Error al actualizar', 'error');
    }
}

async function editarBarbero(id) {
    const barbero = barberos.find(b => b.id === id);
    if (!barbero) {
        mostrarNotificacion('Barbero no encontrado', 'error');
        return;
    }
    
    mostrarModalBarbero(barbero);
}

async function eliminarBarbero(id) {
    // Verificar si tiene turnos asociados
    const { data: turnosAsociados, error: errorTurnos } = await db
        .from('turnos')
        .select('id, cliente, fecha')
        .eq('barbero_id', id)
        .eq('completado', false);
    
    if (errorTurnos) {
        console.error("Error al verificar turnos:", errorTurnos);
    }
    
    let mensajeConfirmacion = '¿Eliminar este barbero permanentemente?';
    
    if (turnosAsociados && turnosAsociados.length > 0) {
        mensajeConfirmacion = `Este barbero tiene ${turnosAsociados.length} turno(s) pendiente(s). ¿Seguro que quieres eliminarlo?`;
    }
    
    if (!confirm(mensajeConfirmacion)) {
        return;
    }
    
    try {
        const { error } = await db
            .from('barberos')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error("Error al eliminar barbero:", error);
            mostrarNotificacion('Error al eliminar barbero', 'error');
            return;
        }
        
        // Actualizar localmente
        barberos = barberos.filter(b => b.id !== id);
        
        // Recargar interfaz
        renderizarBarberosAdmin();
        actualizarSelectBarberos();
        mostrarNotificacion('Barbero eliminado exitosamente', 'exito');
        
    } catch (error) {
        console.error("Error en eliminarBarbero:", error);
        mostrarNotificacion('Error al eliminar', 'error');
    }
}

// 8. MODAL PARA NUEVO/EDITAR BARBERO
function mostrarModalNuevoBarbero() {
    mostrarModalBarbero();
}

function mostrarModalBarbero(barberoExistente = null) {
    const esNuevo = !barberoExistente;
    
    const modalHTML = `
        <div class="modal-overlay" id="modal-barbero" style="
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
                max-width: 500px;
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
                    <h3 style="margin: 0; font-size: 1.2rem;">${esNuevo ? 'Nuevo Barbero' : 'Editar Barbero'}</h3>
                    <button onclick="cerrarModalBarbero()" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        color: white;
                        cursor: pointer;
                        padding: 5px;
                    ">&times;</button>
                </div>
                
                <div class="modal-body" style="padding: 25px;">
                    <form id="form-barbero">
                        <input type="hidden" id="barbero-id" value="${barberoExistente?.id || ''}">
                        
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="barbero-nombre" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Nombre *</label>
                            <input type="text" id="barbero-nombre" class="form-control" 
                                   value="${barberoExistente?.nombre || ''}" 
                                   placeholder="Ej: Juan Pérez" required
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem;">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="barbero-especialidad" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Especialidad *</label>
                            <input type="text" id="barbero-especialidad" class="form-control"
                                   value="${barberoExistente?.especialidad || ''}"
                                   placeholder="Ej: Cortes modernos, Barbas, etc." required
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem;">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="barbero-telefono" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Teléfono</label>
                            <input type="tel" id="barbero-telefono" class="form-control"
                                   value="${barberoExistente?.telefono || ''}"
                                   placeholder="Ej: 0981 123456"
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem;">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="barbero-email" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Email</label>
                            <input type="email" id="barbero-email" class="form-control"
                                   value="${barberoExistente?.email || ''}"
                                   placeholder="Ej: barbero@ejemplo.com"
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem;">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="barbero-horario" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Horario de trabajo</label>
                            <input type="text" id="barbero-horario" class="form-control"
                                   value="${barberoExistente?.horario || ''}"
                                   placeholder="Ej: Lunes a Viernes 9:00-18:00"
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem;">
                        </div>
                        
                        ${!esNuevo ? `
                        <div class="form-group" style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" id="barbero-activo" ${barberoExistente?.activo ? 'checked' : ''} 
                                   style="width: 18px; height: 18px;">
                            <label for="barbero-activo" style="font-weight: 500; color: #333; cursor: pointer;">
                                Barbero activo (aparece disponible para turnos)
                            </label>
                        </div>
                        ` : ''}
                    </form>
                </div>
                
                <div class="modal-footer" style="
                    padding: 20px;
                    border-top: 1px solid #eee;
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                ">
                    <button class="btn-secundario" onclick="cerrarModalBarbero()" style="
                        padding: 10px 20px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 1rem;
                    ">Cancelar</button>
                    <button class="btn-primary" onclick="guardarBarbero()" style="
                        padding: 10px 20px;
                        background: #d4af37;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 1rem;
                        font-weight: 500;
                    ">
                        ${esNuevo ? 'Crear Barbero' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente si hay
    const modalExistente = document.getElementById('modal-barbero');
    if (modalExistente) modalExistente.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function cerrarModalBarbero() {
    const modal = document.getElementById('modal-barbero');
    if (modal) modal.remove();
}

async function guardarBarbero() {
    // Obtener datos del formulario
    const barberoData = {
        nombre: document.getElementById('barbero-nombre').value.trim(),
        especialidad: document.getElementById('barbero-especialidad').value.trim(),
        telefono: document.getElementById('barbero-telefono').value.trim() || null,
        email: document.getElementById('barbero-email').value.trim() || null,
        horario: document.getElementById('barbero-horario').value.trim() || null
    };
    
    const id = document.getElementById('barbero-id').value;
    const esNuevo = !id;
    
    // Validación
    if (!barberoData.nombre || !barberoData.especialidad) {
        mostrarNotificacion('Nombre y especialidad son requeridos', 'error');
        return;
    }
    
    // Si es edición, incluir el campo activo
    if (!esNuevo) {
        barberoData.activo = document.getElementById('barbero-activo').checked;
    } else {
        // Para nuevos barberos, activo por defecto
        barberoData.activo = true;
    }
    
    console.log(`${esNuevo ? 'Creando' : 'Actualizando'} barbero:`, barberoData);
    
    try {
        let result;
        if (esNuevo) {
            result = await db
                .from('barberos')
                .insert([barberoData])
                .select();
        } else {
            result = await db
                .from('barberos')
                .update(barberoData)
                .eq('id', id);
        }
        
        const { data, error } = result;
        
        if (error) {
            console.error("Error al guardar barbero:", error);
            mostrarNotificacion('Error al guardar barbero: ' + error.message, 'error');
            return;
        }
        
        // Si es nuevo, obtener el ID generado
        if (esNuevo && data && data[0]) {
            barberoData.id = data[0].id;
            barberoData.created_at = data[0].created_at;
            barberos.push(barberoData);
        } else {
            // Actualizar localmente
            const index = barberos.findIndex(b => b.id == id);
            if (index !== -1) {
                barberos[index] = { ...barberos[index], ...barberoData };
            }
        }
        
        // Cerrar modal y actualizar interfaz
        cerrarModalBarbero();
        renderizarBarberosAdmin();
        actualizarSelectBarberos();
        mostrarNotificacion(
            `Barbero ${esNuevo ? 'creado' : 'actualizado'} exitosamente`,
            'exito'
        );
        
    } catch (error) {
        console.error("Error en guardarBarbero:", error);
        mostrarNotificacion('Error al guardar barbero', 'error');
    }
}

// 9. FUNCIONES DE TURNOS (ADAPTADAS A TU HTML)
async function cargarTurnosAdmin() {
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
        renderizarTablaFiltrada();
        actualizarEstadisticas();
        console.log(`Turnos cargados: ${turnosReservados.length}`);
        
    } catch (error) {
        console.error("Error en cargarTurnosAdmin:", error);
    }
}

function renderizarTablaFiltrada() {
    const container = document.getElementById('turnos-admin-container');
    if (!container) {
        console.error("ERROR: No se encontró #turnos-admin-container");
        return;
    }

    const fFecha = document.getElementById('filtro-fecha')?.value;
    const fBarbero = document.getElementById('filtro-barbero')?.value;
    const fEstado = document.getElementById('filtro-estado')?.value;

    let filtrados = turnosReservados.filter(t => {
        const matchFecha = !fFecha || t.fecha === fFecha;
        const matchBarbero = !fBarbero || t.barbero_id == fBarbero;
        const matchEstado = !fEstado || 
                           (fEstado === 'pendiente' && !t.completado) || 
                           (fEstado === 'completado' && t.completado);
        return matchFecha && matchBarbero && matchEstado;
    });

    if (filtrados.length === 0) {
        container.innerHTML = `
            <div class="sin-turnos">
                <i class="fas fa-calendar-times"></i>
                <p>No hay turnos con esos filtros</p>
                <p class="subtitulo">Intenta con otros criterios de búsqueda</p>
            </div>
        `;
        return;
    }

    let html = `
        <table class="tabla-turnos-admin" style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
                <tr style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); color: white;">
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Cliente</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Barbero</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Servicios</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Precio</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Fecha</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Hora</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Estado</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    filtrados.forEach(t => {
        const barbero = barberos.find(b => b.id == t.barbero_id);
        const barberoNombre = barbero ? barbero.nombre : `ID: ${t.barbero_id}`;
        
        const serviciosTxt = Array.isArray(t.servicios) ? 
            t.servicios.map(s => s.nombre).join(' + ') : 
            'Ver detalle';
            
        const estadoClase = t.completado ? 'completado' : 'pendiente';
        const estadoTexto = t.completado ? 'Completado' : 'Pendiente';
        const estadoColor = t.completado ? '#28a745' : '#dc3545';
            
        html += `
            <tr style="border-bottom: 1px solid #eee; background-color: ${t.completado ? '#f8f9fa' : 'white'};">
                <td style="padding: 12px 8px; vertical-align: top;">
                    <strong>${t.cliente}</strong><br>
                    <small style="color: #666;">${t.telefono}</small>
                </td>
                <td style="padding: 12px 8px; vertical-align: top;">${barberoNombre}</td>
                <td style="padding: 12px 8px; vertical-align: top;">${serviciosTxt}</td>
                <td style="padding: 12px 8px; vertical-align: top; font-weight: 500;">${(t.precio_total || 0).toLocaleString('es-PY')} Gs</td>
                <td style="padding: 12px 8px; vertical-align: top;">${formatearFechaAdmin(t.fecha)}</td>
                <td style="padding: 12px 8px; vertical-align: top;">${t.hora} hs</td>
                <td style="padding: 12px 8px; vertical-align: top;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: ${estadoColor}; color: white; border-radius: 4px; font-size: 0.85rem; font-weight: 500;">
                        ${estadoTexto}
                    </span>
                </td>
                <td style="padding: 12px 8px; vertical-align: top;">
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        ${!t.completado ? `
                            <button class="btn-secundario" onclick="marcarCompletado(${t.id})" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                                <i class="fas fa-check"></i> Cobrar
                            </button>` : ''}
                        <button class="btn-danger" onclick="eliminarTurno(${t.id})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    
    container.innerHTML = html;
}

async function marcarCompletado(id) {
    try {
        const { error } = await db
            .from('turnos')
            .update({ completado: true })
            .eq('id', id);

        if (error) {
            console.error("Error al cobrar turno:", error);
            mostrarNotificacion("Error al actualizar el turno", "error");
        } else {
            mostrarNotificacion("¡Turno cobrado exitosamente!", "exito");
            // Recargar turnos
            await cargarTurnosAdmin();
        }
    } catch (error) {
        console.error("Error en marcarCompletado:", error);
    }
}

// 10. ELIMINAR TURNO
async function eliminarTurno(id) {
    if (!confirm("¿Eliminar este registro permanentemente?")) {
        return;
    }
    
    try {
        const { error } = await db
            .from('turnos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error al eliminar turno:", error);
            mostrarNotificacion("Error al eliminar el turno: " + error.message, "error");
        } else {
            mostrarNotificacion("Turno eliminado exitosamente", "exito");
            await cargarTurnosAdmin();
        }
    } catch (error) {
        console.error("Error en eliminarTurno:", error);
        mostrarNotificacion("Error al eliminar turno", "error");
    }
}

// 11. ESTADÍSTICAS
function actualizarEstadisticas() {
    const hoy = new Date().toISOString().split('T')[0];
    const turnosHoy = turnosReservados.filter(t => t.fecha === hoy).length;
    const pendientes = turnosReservados.filter(t => !t.completado).length;
    const completados = turnosReservados.filter(t => t.completado).length;
    const totalTurnos = turnosReservados.length;
    const ingresosTotal = turnosReservados
        .filter(t => t.completado)
        .reduce((sum, t) => sum + (t.precio_total || 0), 0);

    // Actualizar elementos
    const elementos = {
        'turnos-hoy': turnosHoy,
        'turnos-pendientes': pendientes,
        'turnos-completados': completados,
        'total-turnos': totalTurnos,
        'ingresos-totales': ingresosTotal.toLocaleString('es-PY') + ' Gs'
    };

    Object.entries(elementos).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    });
}



function configurarEventos() {
    // Eventos de filtros
    const filtros = ['filtro-fecha', 'filtro-barbero', 'filtro-estado'];
    filtros.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                setTimeout(() => renderizarTablaFiltrada(), 300);
            });
        }
    });
    
    // 🔥 BOTÓN RESET TOTAL (funciona aunque tenga spans/iconos)
document.addEventListener('click', function (e) {
    const btn = e.target.closest('#btn-reset-total');
    if (btn) {
        resetTotalSistema();
    }
});


    // Botón limpiar filtros
    const limpiarBtn = document.getElementById('limpiar-filtros');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', () => {
            filtros.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (id === 'filtro-fecha') {
                        el.value = '';
                    } else {
                        el.value = '';
                    }
                }
            });
            renderizarTablaFiltrada();
        });
    }
    
    document.getElementById('btn-exportar').addEventListener('click', exportarPDF);

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 🔰 Título
    doc.setFontSize(18);
    doc.text("Denis Barber Shop", 14, 20);
    doc.setFontSize(14);
    doc.text("Reporte de Estadísticas", 14, 30);

    doc.setFontSize(11);

    // 📊 Datos (tomados del DOM, no recalculamos nada)
    const datos = [
        ["Turnos Hoy", document.getElementById('turnos-hoy').textContent],
        ["Turnos Pendientes", document.getElementById('turnos-pendientes').textContent],
        ["Turnos Completados", document.getElementById('turnos-completados').textContent],
        ["Total Turnos", document.getElementById('total-turnos').textContent],
        ["Ingresos Totales", document.getElementById('ingresos-totales').textContent],
    ];

    let y = 50;
    datos.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, 14, y);
        y += 10;
    });

    // 📅 Fecha
    const fecha = new Date().toLocaleString('es-ES');
    doc.setFontSize(9);
    doc.text(`Generado el: ${fecha}`, 14, y + 10);

    // 💾 Descargar
    doc.save("Reporte_DenisBarberShop.pdf");
}

    
    notif.textContent = texto;
    
    // Estilos según tipo
    if (tipo === 'exito') {
        notif.style.background = 'linear-gradient(135deg, #4CAF50, #2E7D32)';
    } else if (tipo === 'error') {
        notif.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
    } else {
        notif.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
    }
    
    notif.style.display = 'block';
    
    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

function exportarDatos() {
    // Crear datos para exportar
    const datos = {
        barberos: barberos.map(b => ({
            ...b,
            activo: b.activo ? 'Sí' : 'No'
        })),
        turnos: turnosReservados.map(t => ({
            ...t,
            fecha: formatearFechaAdmin(t.fecha),
            completado: t.completado ? 'Sí' : 'No'
        })),
        estadisticas: {
            fecha_exportacion: new Date().toLocaleString('es-PY'),
            total_turnos: turnosReservados.length,
            ingresos_totales: turnosReservados
                .filter(t => t.completado)
                .reduce((sum, t) => sum + (t.precio_total || 0), 0)
        }
    };
    
    // Convertir a JSON
    const datosJSON = JSON.stringify(datos, null, 2);
    
    // Crear blob y descargar
    const blob = new Blob([datosJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `denis_barber_shop_exportacion_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarNotificacion('Datos exportados exitosamente', 'exito');
}

// ============================================
// RESET TOTAL - TURNOS + STORAGE + UI
// ============================================
async function resetTotalSistema() {

    const confirmacion = confirm(
        "⚠️ RESET TOTAL\n\n" +
        "Esto eliminará TODOS los turnos,\n" +
        "limpiará la sesión y recargará el sistema.\n\n" +
        "¿Seguro que deseas continuar?"
    );

    if (!confirmacion) return;

    try {
        // 1️⃣ BORRAR TODOS LOS TURNOS EN SUPABASE
        const { error } = await db
            .from('turnos')
            .delete()
            .neq('id', 0); // borrar todo

        if (error) throw error;

        // 2️⃣ LIMPIAR ESTADO LOCAL
        turnosReservados = [];

        // 3️⃣ LIMPIAR STORAGE
        localStorage.clear();
        sessionStorage.clear();

        // 4️⃣ LIMPIAR UI
        const contenedor = document.getElementById('turnos-admin-container');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="sin-turnos">
                    <i class="fas fa-broom"></i>
                    <p>Sistema reiniciado</p>
                </div>
            `;
        }

        // 5️⃣ NOTIFICACIÓN
        mostrarNotificacion("Reset total realizado correctamente", "exito");

        // 6️⃣ RECARGAR TODO
        setTimeout(() => location.reload(), 1500);

    } catch (err) {
        console.error("Error en reset total:", err);
        mostrarNotificacion("Error al realizar reset total", "error");
    }
}


// 13. Hacer funciones disponibles globalmente
window.mostrarModalNuevoBarbero = mostrarModalNuevoBarbero;
window.cerrarModalBarbero = cerrarModalBarbero;
window.guardarBarbero = guardarBarbero;
window.toggleActivoBarbero = toggleActivoBarbero;
window.editarBarbero = editarBarbero;
window.eliminarBarbero = eliminarBarbero;
window.marcarCompletado = marcarCompletado;
window.eliminarTurno = eliminarTurno;

console.log("admin.js cargado correctamente");
window.resetTotalSistema = resetTotalSistema;

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async () => {
        if (!confirm('¿Cerrar sesión?')) return;

        await window.db.auth.signOut();
        window.location.href = 'login.html';
    });
});


