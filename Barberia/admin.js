// Datos iniciales
let barberos = JSON.parse(localStorage.getItem('barberos')) || [
    { id: 1, nombre: "Carlos Martínez", especialidad: "Cortes modernos", disponible: true },
    { id: 2, nombre: "Jorge Rodríguez", especialidad: "Barbas y bigotes", disponible: true },
    { id: 3, nombre: "Luis González", especialidad: "Cortes clásicos", disponible: true }
];

// Turnos reservados
let turnosReservados = JSON.parse(localStorage.getItem('turnosReservados')) || [];

// Inicializar panel de administración
document.addEventListener('DOMContentLoaded', function() {
    // Verificar acceso
    verificarAcceso();
    
    // Cargar datos
    cargarBarberosAdmin();
    cargarTurnosAdmin();
    actualizarEstadisticas();
    
    // Configurar eventos de filtros
    document.getElementById('filtro-fecha').addEventListener('change', function() {
        cargarTurnosAdmin();
        actualizarEstadisticas();
    });
    
    document.getElementById('filtro-barbero').addEventListener('change', function() {
        cargarTurnosAdmin();
        actualizarEstadisticas();
    });
    
    document.getElementById('filtro-estado').addEventListener('change', function() {
        cargarTurnosAdmin();
        actualizarEstadisticas();
    });
    
    // Configurar botón de limpiar filtros
    const limpiarFiltrosBtn = document.getElementById('limpiar-filtros');
    if (limpiarFiltrosBtn) {
        limpiarFiltrosBtn.addEventListener('click', function() {
            document.getElementById('filtro-fecha').value = '';
            document.getElementById('filtro-barbero').value = '';
            document.getElementById('filtro-estado').value = '';
            cargarTurnosAdmin();
            actualizarEstadisticas();
        });
    }
});

// Verificar acceso con contraseña
function verificarAcceso() {
    const password = sessionStorage.getItem('admin-authenticated');
    
    if (!password || password !== 'admin123') {
        const entrada = prompt("Ingresa la contraseña de administrador:");
        
        if (entrada !== 'admin123') {
            alert("Acceso denegado. Redirigiendo a la página principal.");
            window.location.href = 'index.html';
        } else {
            sessionStorage.setItem('admin-authenticated', 'admin123');
        }
    }
}

// Cargar barberos en el panel de admin con controles de disponibilidad
function cargarBarberosAdmin() {
    const container = document.getElementById('barberos-admin-container');
    if (!container) return;
    
    barberos = JSON.parse(localStorage.getItem('barberos')) || [];
    
    container.innerHTML = '';
    
    barberos.forEach(barbero => {
        const barberoCard = document.createElement('div');
        barberoCard.className = 'barbero-card-admin';
        
        barberoCard.innerHTML = `
            <div class="barbero-header">
                <div class="barbero-nombre">${barbero.nombre}</div>
                <div class="estado ${barbero.disponible ? 'estado-disponible' : 'estado-no-disponible'}">
                    ${barbero.disponible ? 'Disponible' : 'No disponible'}
                </div>
            </div>
            <div class="barbero-info">
                <p class="barbero-especialidad">${barbero.especialidad}</p>
                <button class="btn-secundario toggle-disponibilidad-admin" data-id="${barbero.id}">
                    <i class="fas ${barbero.disponible ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                    ${barbero.disponible ? 'Desactivar' : 'Activar'}
                </button>
            </div>
        `;
        
        container.appendChild(barberoCard);
    });
    
    // Configurar eventos para cambiar disponibilidad
    document.querySelectorAll('.toggle-disponibilidad-admin').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            cambiarDisponibilidadAdmin(id);
        });
    });
}

// Cambiar disponibilidad de barbero desde admin
function cambiarDisponibilidadAdmin(id) {
    barberos = JSON.parse(localStorage.getItem('barberos')) || [];
    const barberoIndex = barberos.findIndex(b => b.id === id);
    
    if (barberoIndex !== -1) {
        barberos[barberoIndex].disponible = !barberos[barberoIndex].disponible;
        localStorage.setItem('barberos', JSON.stringify(barberos));
        
        // Disparar evento storage para actualizar la otra pestaña
        window.dispatchEvent(new Event('storage'));
        
        // Recargar barberos en admin
        cargarBarberosAdmin();
        
        // Mostrar notificación
        mostrarNotificacionAdmin(`${barberos[barberoIndex].nombre} ahora está ${barberos[barberoIndex].disponible ? 'disponible' : 'no disponible'}`, 'exito');
    }
}

// Cargar turnos en el panel de administración
function cargarTurnosAdmin() {
    const container = document.getElementById('turnos-admin-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Obtener valores de filtros
    const filtroFecha = document.getElementById('filtro-fecha').value;
    const filtroBarbero = document.getElementById('filtro-barbero').value;
    const filtroEstado = document.getElementById('filtro-estado').value;
    
    // Aplicar filtros
    let turnosFiltrados = [...turnosReservados];
    
    if (filtroFecha) {
        turnosFiltrados = turnosFiltrados.filter(turno => turno.fecha === filtroFecha);
    }
    
    if (filtroBarbero) {
        turnosFiltrados = turnosFiltrados.filter(turno => turno.barberoId === parseInt(filtroBarbero));
    }
    
    if (filtroEstado === 'pendiente') {
        turnosFiltrados = turnosFiltrados.filter(turno => !turno.completado);
    } else if (filtroEstado === 'completado') {
        turnosFiltrados = turnosFiltrados.filter(turno => turno.completado);
    }
    
    // Ordenar por fecha y hora
    turnosFiltrados.sort((a, b) => {
        const fechaA = new Date(a.fecha + ' ' + a.hora);
        const fechaB = new Date(b.fecha + ' ' + b.hora);
        return fechaA - fechaB;
    });
    
    if (turnosFiltrados.length === 0) {
        container.innerHTML = '<p class="sin-turnos">No hay turnos que coincidan con los filtros.</p>';
        return;
    }
    
    // Crear tabla de turnos
    const tabla = document.createElement('div');
    tabla.className = 'tabla-turnos-admin';
    
    // Crear encabezado
    tabla.innerHTML = `
        <div class="fila encabezado">
            <div class="columna">Cliente</div>
            <div class="columna">Teléfono</div>
            <div class="columna">Barbero</div>
            <div class="columna">Fecha</div>
            <div class="columna">Hora</div>
            <div class="columna">Estado</div>
            <div class="columna">Acciones</div>
        </div>
    `;
    
    // Agregar filas para cada turno
    turnosFiltrados.forEach(turno => {
        const fila = document.createElement('div');
        fila.className = `fila ${turno.completado ? 'completado' : ''}`;
        
        fila.innerHTML = `
            <div class="columna">${turno.cliente}</div>
            <div class="columna">${turno.telefono}</div>
            <div class="columna">${turno.barbero}</div>
            <div class="columna">${formatearFecha(turno.fecha)}</div>
            <div class="columna">${turno.hora}</div>
            <div class="columna">
                <span class="estado-turno ${turno.completado ? 'completado' : 'pendiente'}">
                    ${turno.completado ? 'Completado' : 'Pendiente'}
                </span>
            </div>
            <div class="columna acciones">
                ${!turno.completado ? 
                    `<button class="btn-secundario completar-turno" data-id="${turno.id}">
                        <i class="fas fa-check"></i> Completar
                    </button>` : 
                    ''
                }
                <button class="btn-danger eliminar-turno" data-id="${turno.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        tabla.appendChild(fila);
    });
    
    container.appendChild(tabla);
    
    // Configurar eventos para los botones
    document.querySelectorAll('.completar-turno').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            completarTurno(id);
        });
    });
    
    document.querySelectorAll('.eliminar-turno').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            eliminarTurno(id);
        });
    });
}

// Marcar un turno como completado
function completarTurno(id) {
    if (confirm('¿Marcar este turno como completado?')) {
        const turnos = JSON.parse(localStorage.getItem('turnosReservados')) || [];
        const turnoIndex = turnos.findIndex(turno => turno.id === id);
        
        if (turnoIndex !== -1) {
            turnos[turnoIndex].completado = true;
            localStorage.setItem('turnosReservados', JSON.stringify(turnos));
            
            // Actualizar datos y vista
            turnosReservados = turnos;
            cargarTurnosAdmin();
            actualizarEstadisticas();
            
            mostrarNotificacionAdmin('Turno marcado como completado', 'exito');
        }
    }
}

// Eliminar un turno
function eliminarTurno(id) {
    if (confirm('¿Eliminar permanentemente este turno?')) {
        const nuevosTurnos = turnosReservados.filter(turno => turno.id !== id);
        localStorage.setItem('turnosReservados', JSON.stringify(nuevosTurnos));
        
        // Actualizar datos y vista
        turnosReservados = nuevosTurnos;
        cargarTurnosAdmin();
        actualizarEstadisticas();
        
        mostrarNotificacionAdmin('Turno eliminado permanentemente', 'exito');
    }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const hoy = new Date().toISOString().split('T')[0];
    const turnosHoy = turnosReservados.filter(t => t.fecha === hoy && !t.completado).length;
    const turnosPendientes = turnosReservados.filter(t => !t.completado).length;
    const turnosCompletados = turnosReservados.filter(t => t.completado).length;
    const totalTurnos = turnosReservados.length;
    
    // Actualizar elementos si existen
    const hoyElement = document.getElementById('turnos-hoy');
    const pendientesElement = document.getElementById('turnos-pendientes');
    const completadosElement = document.getElementById('turnos-completados');
    const totalElement = document.getElementById('total-turnos');
    
    if (hoyElement) hoyElement.textContent = turnosHoy;
    if (pendientesElement) pendientesElement.textContent = turnosPendientes;
    if (completadosElement) completadosElement.textContent = turnosCompletados;
    if (totalElement) totalElement.textContent = totalTurnos;
}

// Mostrar notificación en panel admin
function mostrarNotificacionAdmin(texto, tipo) {
    // Crear elemento de notificación si no existe
    let notificacion = document.getElementById('notificacion-admin');
    
    if (!notificacion) {
        notificacion = document.createElement('div');
        notificacion.id = 'notificacion-admin';
        document.body.appendChild(notificacion);
    }
    
    notificacion.textContent = texto;
    notificacion.className = `notificacion-admin notificacion-${tipo}`;
    
    // Mostrar notificación
    notificacion.style.display = 'block';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notificacion.style.display = 'none';
    }, 3000);
}

// Formatear fecha para mostrar
function formatearFecha(fechaStr) {
    const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Añadir estilos CSS para el panel admin
function agregarEstilosAdmin() {
    const estilos = `
        <style>
            .tabla-turnos-admin {
                background-color: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                margin-bottom: 20px;
            }
            
            .fila {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 10px;
                padding: 15px;
                align-items: center;
                border-bottom: 1px solid #eee;
            }
            
            .fila.encabezado {
                background-color: #2d2d2d;
                color: white;
                font-weight: 600;
            }
            
            .fila.completado {
                opacity: 0.7;
                background-color: #f9f9f9;
            }
            
            .columna {
                padding: 5px;
                font-size: 0.9rem;
            }
            
            .acciones {
                display: flex;
                gap: 5px;
                flex-wrap: wrap;
            }
            
            .estado-turno {
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 500;
                display: inline-block;
            }
            
            .estado-turno.pendiente {
                background-color: #ff9800;
                color: white;
            }
            
            .estado-turno.completado {
                background-color: #4CAF50;
                color: white;
            }
            
            .barbero-card-admin {
                background-color: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                margin-bottom: 15px;
            }
            
            .notificacion-admin {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                display: none;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }
            
            .notificacion-exito {
                background-color: #4CAF50;
            }
            
            .notificacion-error {
                background-color: #f44336;
            }
            
            .sin-turnos {
                text-align: center;
                padding: 30px;
                color: #666;
            }
            
            .filtros {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .estadisticas-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .estadistica-card {
                background-color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .estadistica-card h3 {
                font-size: 1rem;
                margin-bottom: 10px;
                color: #666;
            }
            
            .estadistica-card p {
                font-size: 2rem;
                font-weight: 700;
                color: #d4af37;
            }
            
            /* Responsive para panel admin */
            @media (max-width: 1024px) {
                .fila {
                    grid-template-columns: repeat(4, 1fr);
                }
                
                .fila .columna:nth-child(1),
                .fila .columna:nth-child(2),
                .fila .columna:nth-child(6) {
                    display: none;
                }
            }
            
            @media (max-width: 768px) {
                .fila {
                    grid-template-columns: 1fr;
                    gap: 10px;
                    padding: 15px;
                    border-bottom: 2px solid #eee;
                }
                
                .fila.encabezado {
                    display: none;
                }
                
                .columna {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #f0f0f0;
                    padding: 8px 0;
                }
                
                .columna:before {
                    content: attr(data-label);
                    font-weight: 600;
                    color: #666;
                }
                
                .acciones {
                    justify-content: center;
                    padding-top: 10px;
                    border-bottom: none;
                }
                
                .acciones:before {
                    display: none;
                }
                
                .filtros {
                    grid-template-columns: 1fr;
                }
                
                .estadisticas-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', estilos);
}

// Agregar estilos cuando se cargue el admin
agregarEstilosAdmin();