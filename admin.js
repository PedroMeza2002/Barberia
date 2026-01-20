// ============================================
// ADMIN.JS - Sistema de Gestión de Barbería
// ============================================

// 1. CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://hcueuizcuiwscxqcmabn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4nmQhV4bchtTGumi5J2qSA_7Rli-O1m';

// Verificar si Supabase está disponible
if (typeof supabase === 'undefined') {
    console.error("Supabase no está cargado");
    document.addEventListener('DOMContentLoaded', function() {
        alert("Error: Supabase no está disponible. Recarga la página.");
    });
} else {
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Variables de estado global
    let turnosReservados = [];
    let barberos = [];
    
    // 2. INICIALIZACIÓN
    document.addEventListener('DOMContentLoaded', async function() {
        console.log("Inicializando sistema administrativo...");
        
        // Verificar acceso de administrador
        verificarAcceso();
        
        // Cargar datos iniciales
        await cargarDatosIniciales();
        
        // Configurar eventos
        configurarEventos();
        
        // Suscripción realtime para actualizaciones automáticas
        configurarSuscripcionesRealtime();
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
        
        const { data: barberosDB, error } = await _supabase
            .from('barberos')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error("Error al cargar barberos:", error);
            
            // Usar datos locales temporalmente
            barberos = [
                { 
                    id: 1, 
                    nombre: "Denis", 
                    especialidad: "Corte y barba", 
                    activo: true,
                    telefono: "",
                    email: "",
                    horario: "Lunes a Viernes: 9:00-18:00"
                },
                { 
                    id: 2, 
                    nombre: "Leo", 
                    especialidad: "Corte y barba", 
                    activo: true,
                    telefono: "",
                    email: "",
                    horario: "Martes a Sábado: 10:00-19:00"
                },
                { 
                    id: 3, 
                    nombre: "Silva", 
                    especialidad: "Corte y barba", 
                    activo: true,
                    telefono: "",
                    email: "",
                    horario: "Lunes a Sábado: 8:00-17:00"
                }
            ];
            
            mostrarNotificacion("Usando barberos predeterminados. Verifica tu conexión.", "advertencia");
        } else {
            // Procesar barberos para asegurar que todos los campos existan
            barberos = barberosDB.map(barbero => ({
                id: barbero.id,
                nombre: barbero.nombre || "Sin nombre",
                especialidad: barbero.especialidad || "Sin especialidad",
                activo: barbero.activo !== false, // Default true
                telefono: barbero.telefono || "",
                email: barbero.email || "",
                horario: barbero.horario || "Horario no definido",
                created_at: barbero.created_at || new Date().toISOString()
            }));
        }
        
        console.log(`Barberos cargados: ${barberos.length}`);
        
        // Renderizar barberos y actualizar select de filtros
        renderizarBarberosAdmin();
        actualizarSelectBarberos();
    }
    
    // 5. RENDERIZADO DE BARBEROS EN LA INTERFAZ
    function renderizarBarberosAdmin() {
        const container = document.getElementById('barberos-admin-container');
        if (!container) {
            console.log("Contenedor de barberos no encontrado.");
            return;
        }
        
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
            html += `
                <div class="barbero-card-admin ${!barbero.activo ? 'completado' : ''}">
                    <div class="barbero-header">
                        <div class="barbero-nombre">${barbero.nombre}</div>
                        <div class="estado ${barbero.activo ? 'estado-disponible' : 'estado-no-disponible'}">
                            ${barbero.activo ? 'Activo' : 'Inactivo'}
                        </div>
                    </div>
                    
                    <div class="barbero-info">
                        <p class="barbero-especialidad">${barbero.especialidad}</p>
                        
                        <div class="turno-detalle">
                            <i class="fas fa-phone"></i>
                            <span>${barbero.telefono || 'No registrado'}</span>
                        </div>
                        
                        <div class="turno-detalle">
                            <i class="fas fa-envelope"></i>
                            <span>${barbero.email || 'No registrado'}</span>
                        </div>
                        
                        <div class="turno-detalle">
                            <i class="fas fa-clock"></i>
                            <span>${barbero.horario}</span>
                        </div>
                    </div>
                    
                    <div class="barbero-acciones" style="padding: 15px; border-top: 1px solid #eee;">
                        <button class="btn-secundario btn-sm" onclick="toggleActivoBarbero(${barbero.id}, ${!barbero.activo})" style="margin-right: 10px;">
                            <i class="fas fa-power-off"></i> ${barbero.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn-editar" onclick="editarBarbero(${barbero.id})" style="margin-right: 10px;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-danger" onclick="eliminarBarbero(${barbero.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        // Añadir botón para nuevo barbero
        html += `
            <div class="barbero-card-admin" style="text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed #d4af37;">
                <i class="fas fa-user-plus" style="font-size: 2.5rem; color: #d4af37; margin-bottom: 15px;"></i>
                <p style="margin-bottom: 20px; color: #666;">Agregar nuevo barbero</p>
                <button class="btn-primary" onclick="mostrarModalNuevoBarbero()" style="max-width: 200px;">
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
    
    // 6. FUNCIONES CRUD PARA BARBEROS
    window.toggleActivoBarbero = async function(id, nuevoEstado) {
        const { error } = await _supabase
            .from('barberos')
            .update({ activo: nuevoEstado })
            .eq('id', id);
        
        if (error) {
            console.error("Error al actualizar barbero:", error);
            mostrarNotificacion('Error al actualizar estado', 'error');
            return;
        }
        
        // Actualizar localmente
        const index = barberos.findIndex(b => b.id === id);
        if (index !== -1) {
            barberos[index].activo = nuevoEstado;
        }
        
        // Recargar la interfaz
        renderizarBarberosAdmin();
        actualizarSelectBarberos();
        mostrarNotificacion(
            `Barbero ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
            'exito'
        );
    };
    
    window.editarBarbero = async function(id) {
        const barbero = barberos.find(b => b.id === id);
        if (!barbero) {
            mostrarNotificacion('Barbero no encontrado', 'error');
            return;
        }
        
        mostrarModalBarbero(barbero);
    };
    
    window.eliminarBarbero = async function(id) {
        // Verificar si tiene turnos asociados
        const { data: turnosAsociados } = await _supabase
            .from('turnos')
            .select('id, cliente, fecha')
            .eq('barbero_id', id)
            .eq('completado', false);
        
        let mensajeConfirmacion = '¿Eliminar este barbero permanentemente?';
        
        if (turnosAsociados && turnosAsociados.length > 0) {
            mensajeConfirmacion = `Este barbero tiene ${turnosAsociados.length} turno(s) pendiente(s). ¿Seguro que quieres eliminarlo?`;
        }
        
        if (!confirm(mensajeConfirmacion)) {
            return;
        }
        
        const { error } = await _supabase
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
    };
    
    // 7. MODAL PARA NUEVO/EDITAR BARBERO
    window.mostrarModalNuevoBarbero = function() {
        mostrarModalBarbero();
    };
    
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
                ">
                    <div class="modal-header" style="
                        padding: 20px;
                        border-bottom: 1px solid #eee;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <h3 style="margin: 0; color: #1a1a1a;">${esNuevo ? 'Nuevo Barbero' : 'Editar Barbero'}</h3>
                        <button onclick="cerrarModalBarbero()" style="
                            background: none;
                            border: none;
                            font-size: 1.5rem;
                            color: #666;
                            cursor: pointer;
                            padding: 5px;
                        ">&times;</button>
                    </div>
                    
                    <div class="modal-body" style="padding: 20px;">
                        <form id="form-barbero" onsubmit="event.preventDefault(); guardarBarbero();">
                            <input type="hidden" id="barbero-id" value="${barberoExistente?.id || ''}">
                            
                            <div class="form-group">
                                <label for="barbero-nombre">Nombre *</label>
                                <input type="text" id="barbero-nombre" class="form-control" 
                                       value="${barberoExistente?.nombre || ''}" 
                                       placeholder="Ej: Juan Pérez" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="barbero-especialidad">Especialidad *</label>
                                <input type="text" id="barbero-especialidad" class="form-control"
                                       value="${barberoExistente?.especialidad || ''}"
                                       placeholder="Ej: Cortes modernos, Barbas, etc." required>
                            </div>
                            
                            <div class="form-group">
                                <label for="barbero-telefono">Teléfono</label>
                                <input type="tel" id="barbero-telefono" class="form-control"
                                       value="${barberoExistente?.telefono || ''}"
                                       placeholder="Ej: 0981 123456">
                            </div>
                            
                            <div class="form-group">
                                <label for="barbero-email">Email</label>
                                <input type="email" id="barbero-email" class="form-control"
                                       value="${barberoExistente?.email || ''}"
                                       placeholder="Ej: barbero@ejemplo.com">
                            </div>
                            
                            <div class="form-group">
                                <label for="barbero-horario">Horario de trabajo</label>
                                <input type="text" id="barbero-horario" class="form-control"
                                       value="${barberoExistente?.horario || ''}"
                                       placeholder="Ej: Lunes a Viernes 9:00-18:00">
                            </div>
                            
                            ${!esNuevo ? `
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" id="barbero-activo" ${barberoExistente?.activo ? 'checked' : ''}>
                                    <span>Barbero activo (aparece disponible para turnos)</span>
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
                        gap: 10px;
                    ">
                        <button class="btn-secundario" onclick="cerrarModalBarbero()">Cancelar</button>
                        <button class="btn-primary" onclick="guardarBarbero()">
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
    
    window.cerrarModalBarbero = function() {
        const modal = document.getElementById('modal-barbero');
        if (modal) modal.remove();
    };
    
    window.guardarBarbero = async function() {
        // Obtener datos del formulario
        const barberoData = {
            nombre: document.getElementById('barbero-nombre').value.trim(),
            especialidad: document.getElementById('barbero-especialidad').value.trim(),
            telefono: document.getElementById('barbero-telefono').value.trim(),
            email: document.getElementById('barbero-email').value.trim(),
            horario: document.getElementById('barbero-horario').value.trim()
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
        
        let result;
        if (esNuevo) {
            result = await _supabase
                .from('barberos')
                .insert([barberoData])
                .select();
        } else {
            result = await _supabase
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
    };
    
    // 8. FUNCIONES EXISTENTES DE TURNOS
    async function cargarTurnosAdmin() {
        const { data, error } = await _supabase
            .from('turnos')
            .select('*')
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });
    
        if (error) {
            console.error('Error cargando turnos:', error);
            mostrarNotificacion('Error al cargar turnos', 'error');
            return;
        }
    
        turnosReservados = data;
        renderizarTablaFiltrada();
        actualizarEstadisticas();
    }
    
    function renderizarTablaFiltrada() {
        const container = document.getElementById('turnos-admin-container');
        if (!container) return;
    
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
            <div class="fila encabezado">
                <div class="columna">Cliente</div>
                <div class="columna">Barbero</div>
                <div class="columna">Servicios</div>
                <div class="columna">Precio</div>
                <div class="columna">Fecha</div>
                <div class="columna">Hora</div>
                <div class="columna">Estado</div>
                <div class="columna">Acciones</div>
            </div>
        `;
    
        filtrados.forEach(t => {
            const barbero = barberos.find(b => b.id == t.barbero_id);
            const barberoNombre = barbero ? barbero.nombre : `ID: ${t.barbero_id}`;
            
            const serviciosTxt = Array.isArray(t.servicios) ? 
                t.servicios.map(s => s.nombre).join(' + ') : 
                'Ver detalle';
                
            const estadoClase = t.completado ? 'completado' : 'pendiente';
            const estadoTexto = t.completado ? 'Completado' : 'Pendiente';
                
            html += `
                <div class="fila ${t.completado ? 'completado' : ''}">
                    <div class="columna" data-label="Cliente">
                        <strong>${t.cliente}</strong><br>
                        <small>${t.telefono}</small>
                    </div>
                    <div class="columna" data-label="Barbero">${barberoNombre}</div>
                    <div class="columna" data-label="Servicios">${serviciosTxt}</div>
                    <div class="columna" data-label="Precio">${(t.precio_total || 0).toLocaleString('es-PY')} Gs</div>
                    <div class="columna" data-label="Fecha">${t.fecha}</div>
                    <div class="columna" data-label="Hora">${t.hora} hs</div>
                    <div class="columna" data-label="Estado">
                        <span class="estado-turno ${estadoClase}">${estadoTexto}</span>
                    </div>
                    <div class="columna acciones" data-label="Acciones">
                        ${!t.completado ? `
                            <button class="btn-secundario" onclick="marcarCompletado(${t.id})">
                                <i class="fas fa-check"></i> Cobrar
                            </button>` : ''}
                        <button class="btn-danger" onclick="eliminarTurno(${t.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    
        container.innerHTML = html;
    }
    
    window.marcarCompletado = async function(id) {
        const { error } = await _supabase
            .from('turnos')
            .update({ completado: true })
            .eq('id', id);
    
        if (error) {
            console.error("Error al cobrar turno:", error);
            mostrarNotificacion("Error al actualizar el turno", "error");
        } else {
            mostrarNotificacion("¡Turno cobrado exitosamente!", "exito");
        }
    };
    
    window.eliminarTurno = async function(id) {
        if (!confirm("¿Eliminar este registro permanentemente?")) {
            return;
        }
        
        const { error } = await _supabase
            .from('turnos')
            .delete()
            .eq('id', id);
    
        if (error) {
            console.error("Error al eliminar turno:", error);
            mostrarNotificacion("Error al eliminar el turno", "error");
        } else {
            mostrarNotificacion("Registro eliminado", "error");
        }
    };
    
    // 9. ESTADÍSTICAS
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
        document.getElementById('turnos-hoy').textContent = turnosHoy;
        document.getElementById('turnos-pendientes').textContent = pendientes;
        document.getElementById('turnos-completados').textContent = completados;
        document.getElementById('total-turnos').textContent = totalTurnos;
        document.getElementById('ingresos-totales').textContent = ingresosTotal.toLocaleString('es-PY') + ' Gs';
    }
    
    // 10. FUNCIONES AUXILIARES
    function verificarAcceso() {
        const auth = sessionStorage.getItem('admin-authenticated');
        if (auth !== 'admin123') {
            const pass = prompt("Contraseña de Administrador:");
            if (pass === "admin123") {
                sessionStorage.setItem('admin-authenticated', 'admin123');
            } else {
                window.location.href = 'index.html';
            }
        }
    }
    
    function configurarEventos() {
        // Eventos de filtros de turnos
        const filtros = ['filtro-fecha', 'filtro-barbero', 'filtro-estado'];
        filtros.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', renderizarTablaFiltrada);
        });
    
        if (document.getElementById('limpiar-filtros')) {
            document.getElementById('limpiar-filtros').addEventListener('click', () => {
                filtros.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                renderizarTablaFiltrada();
            });
        }
        
        // Evento para exportar datos
        const btnExportar = document.getElementById('btn-exportar');
        if (btnExportar) {
            btnExportar.addEventListener('click', exportarDatos);
        }
    }
    
    function configurarSuscripcionesRealtime() {
        // Suscripción para turnos
        _supabase
            .channel('admin-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, () => {
                console.log("Cambio detectado en turnos, recargando...");
                cargarTurnosAdmin();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'barberos' }, () => {
                console.log("Cambio detectado en barberos, recargando...");
                cargarBarberosDesdeSupabase();
            })
            .subscribe();
    }
    
    function mostrarNotificacion(texto, tipo) {
        let notif = document.getElementById('notificacion-admin');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'notificacion-admin';
            document.body.appendChild(notif);
        }
        
        notif.textContent = texto;
        notif.className = `notificacion-admin notificacion-${tipo}`;
        notif.style.display = 'block';
        
        setTimeout(() => {
            notif.style.display = 'none';
        }, 3000);
    }
    
    function exportarDatos() {
        // Crear datos para exportar
        const datos = {
            barberos: barberos,
            turnos: turnosReservados,
            estadisticas: {
                fecha: new Date().toLocaleString('es-PY'),
                totalTurnos: turnosReservados.length,
                ingresosTotales: turnosReservados
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
        a.download = `barberia_elite_datos_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        mostrarNotificacion('Datos exportados exitosamente', 'exito');
    }
    
    
    console.log("admin.js cargado correctamente con gestión de barberos");
}