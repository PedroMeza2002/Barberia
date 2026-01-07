// Datos iniciales de los barberos
let barberos = JSON.parse(localStorage.getItem('barberos')) || [
    { id: 1, nombre: "Christian", especialidad: "Cortes y barba", disponible: true },
    { id: 2, nombre: "Denis", especialidad: "Cortes y barba", disponible: true },
    { id: 3, nombre: "Pedro", especialidad: "Cortes y barba", disponible: true }
];

// Guardar barberos en localStorage si no existen
if (!localStorage.getItem('barberos')) {
    localStorage.setItem('barberos', JSON.stringify(barberos));
}

// Horarios disponibles
const horarios = [
    "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

// Turnos reservados
let turnosReservados = JSON.parse(localStorage.getItem('turnosReservados')) || [];

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    cargarBarberos();
    cargarSelectBarberos();
    inicializarFecha();
    cargarHorarios();
    cargarTurnosReservados();
    actualizarContadorDisponibles();
    
    // Configurar evento para el botón de reserva
    document.getElementById('reservar-btn').addEventListener('click', reservarTurno);
    
    // Configurar enlace de administración con contraseña
    document.getElementById('admin-link').addEventListener('click', function(e) {
        e.preventDefault();
        solicitarPasswordAdmin();
    });
    
    document.getElementById('admin-link-mobile').addEventListener('click', function(e) {
        e.preventDefault();
        solicitarPasswordAdmin();
    });
    
    // Configurar menú móvil
    const menuToggle = document.querySelector('.menu-mobile-toggle');
    const navMobile = document.querySelector('.nav-mobile');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navMobile.classList.toggle('active');
        });
    }
    
    // Cerrar menú móvil al hacer clic en un enlace
    document.querySelectorAll('.nav-mobile a').forEach(link => {
        link.addEventListener('click', function() {
            navMobile.classList.remove('active');
        });
    });
});

// Solicitar contraseña para admin
function solicitarPasswordAdmin() {
    const password = prompt("Ingresa la contraseña de administrador:");
    if (password === "admin123") {
        window.location.href = "admin.html";
    } else {
        alert("Contraseña incorrecta. Acceso denegado.");
    }
}

// Cargar la información de los barberos en la página 
function cargarBarberos() {
    const container = document.getElementById('barberos-container');
    container.innerHTML = '';
    
    barberos.forEach(barbero => {
        const barberoCard = document.createElement('div');
        barberoCard.className = 'barbero-card';
        
        barberoCard.innerHTML = `
            <div class="barbero-header">
                <div class="barbero-nombre">${barbero.nombre}</div>
                <div class="estado ${barbero.disponible ? 'estado-disponible' : 'estado-no-disponible'}">
                    ${barbero.disponible ? 'Disponible' : 'No disponible'}
                </div>
            </div>
            <div class="barbero-info">
                <p class="barbero-especialidad">Especialidad: ${barbero.especialidad}</p>
                <p class="barbero-disponibilidad">
                    <i class="fas ${barbero.disponible ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${barbero.disponible ? 'Aceptando turnos' : 'No disponible temporalmente'}
                </p>
            </div>
        `;
        
        container.appendChild(barberoCard);
    });
}

// Actualizar contador de barberos disponibles
function actualizarContadorDisponibles() {
    const disponibles = barberos.filter(b => b.disponible).length;
    const contador = document.getElementById('contador-disponibles');
    contador.textContent = `${disponibles} disponible${disponibles !== 1 ? 's' : ''}`;
}

// Cargar barberos disponibles en el select del formulario
function cargarSelectBarberos() {
    const select = document.getElementById('barbero');
    select.innerHTML = '<option value="">Selecciona un barbero</option>';
    
    // Filtrar solo barberos disponibles
    const barberosDisponibles = barberos.filter(barbero => barbero.disponible);
    
    if (barberosDisponibles.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No hay barberos disponibles";
        select.appendChild(option);
        select.disabled = true;
    } else {
        barberosDisponibles.forEach(barbero => {
            const option = document.createElement('option');
            option.value = barbero.id;
            option.textContent = barbero.nombre;
            select.appendChild(option);
        });
        select.disabled = false;
    }
}

// Inicializar el campo de fecha con la fecha actual
function inicializarFecha() {
    const fechaInput = document.getElementById('fecha');
    const hoy = new Date();
    const fechaFormateada = hoy.toISOString().split('T')[0];
    fechaInput.value = fechaFormateada;
    fechaInput.min = fechaFormateada;
    
    // Establecer fecha máxima (30 días desde hoy)
    const maxFecha = new Date();
    maxFecha.setDate(maxFecha.getDate() + 30);
    const maxFechaFormateada = maxFecha.toISOString().split('T')[0];
    fechaInput.max = maxFechaFormateada;
}

// Cargar horarios en el select
function cargarHorarios() {
    const select = document.getElementById('hora');
    select.innerHTML = '<option value="">Selecciona una hora</option>';
    
    horarios.forEach(hora => {
        const option = document.createElement('option');
        option.value = hora;
        option.textContent = hora;
        select.appendChild(option);
    });
}

// Reservar un turno
function reservarTurno() {
    // Obtener valores del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const barberoId = parseInt(document.getElementById('barbero').value);
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    
    // Validar campos
    if (!nombre || !telefono || !barberoId || !fecha || !hora) {
        mostrarMensaje('Por favor, completa todos los campos del formulario', 'error');
        return;
    }
    
    // Verificar si el barbero está disponible
    const barbero = barberos.find(b => b.id === barberoId);
    if (!barbero || !barbero.disponible) {
        mostrarMensaje('El barbero seleccionado ya no está disponible. Por favor, selecciona otro.', 'error');
        return;
    }
    
    // Verificar si el turno ya está reservado
    const turnoExistente = turnosReservados.find(turno => 
        turno.barberoId === barberoId && 
        turno.fecha === fecha && 
        turno.hora === hora &&
        !turno.completado
    );
    
    if (turnoExistente) {
        mostrarMensaje('Este horario ya está reservado. Por favor, selecciona otro.', 'error');
        return;
    }
    
    // Crear nuevo turno
    const nuevoTurno = {
        id: Date.now(), // ID único basado en timestamp
        cliente: nombre,
        telefono: telefono,
        barberoId: barberoId,
        barbero: barbero.nombre,
        fecha: fecha,
        hora: hora,
        fechaReserva: new Date().toISOString(),
        completado: false
    };
    
    // Agregar turno a la lista
    turnosReservados.push(nuevoTurno);
    
    // Guardar en localStorage
    localStorage.setItem('turnosReservados', JSON.stringify(turnosReservados));
    
    // Recargar la lista de turnos
    cargarTurnosReservados();
    
    // Mostrar mensaje de éxito
    mostrarMensaje(`¡Turno reservado exitosamente con ${barbero.nombre} para el ${formatearFecha(fecha)} a las ${hora}!`, 'exito');
    
    // Limpiar formulario (excepto fecha)
    document.getElementById('nombre').value = '';
    document.getElementById('telefono').value = '';
    document.getElementById('barbero').selectedIndex = 0;
    document.getElementById('hora').selectedIndex = 0;
    
    // Enfocar en el primer campo
    document.getElementById('nombre').focus();
}

// Cargar los turnos reservados
function cargarTurnosReservados() {
    const container = document.getElementById('turnos-container');
    container.innerHTML = '';
    
    // Obtener todos los turnos del localStorage
    const todosTurnos = JSON.parse(localStorage.getItem('turnosReservados')) || [];
    
    // Filtrar solo los turnos no completados y ordenar por fecha
    const turnosPendientes = todosTurnos
        .filter(turno => !turno.completado)
        .sort((a, b) => new Date(a.fecha + ' ' + a.hora) - new Date(b.fecha + ' ' + b.hora));
    
    if (turnosPendientes.length === 0) {
        container.innerHTML = `
            <div class="sin-turnos">
                <p><i class="fas fa-calendar-times"></i> No tienes turnos reservados.</p>
                <p class="subtitulo">Reserva tu primer turno usando el formulario superior.</p>
            </div>
        `;
        return;
    }
    
    turnosPendientes.forEach(turno => {
        const turnoCard = document.createElement('div');
        turnoCard.className = 'turno-card';
        
        turnoCard.innerHTML = `
            <div class="turno-info">
                <div class="turno-cliente">${turno.cliente}</div>
                <div class="turno-detalle">
                    <i class="fas fa-user"></i>
                    <span>Barbero: ${turno.barbero}</span>
                </div>
                <div class="turno-detalle">
                    <i class="fas fa-calendar"></i>
                    <span>Fecha: ${formatearFecha(turno.fecha)}</span>
                </div>
                <div class="turno-detalle">
                    <i class="fas fa-clock"></i>
                    <span>Hora: ${turno.hora}</span>
                </div>
                <div class="turno-detalle">
                    <i class="fas fa-phone"></i>
                    <span>Teléfono: ${turno.telefono}</span>
                </div>
            </div>
            <button class="btn-danger cancelar-turno" data-id="${turno.id}">
                <i class="fas fa-times"></i> Cancelar Turno
            </button>
        `;
        
        container.appendChild(turnoCard);
    });
    
    // Configurar eventos para los botones de cancelar
    document.querySelectorAll('.cancelar-turno').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            cancelarTurno(id);
        });
    });
}

// Cancelar un turno
function cancelarTurno(id) {
    if (confirm('¿Estás seguro de que quieres cancelar este turno?')) {
        // Marcar como completado (en lugar de eliminar) para mantener historial
        const turnos = JSON.parse(localStorage.getItem('turnosReservados')) || [];
        const turnoIndex = turnos.findIndex(turno => turno.id === id);
        
        if (turnoIndex !== -1) {
            turnos[turnoIndex].completado = true;
            turnos[turnoIndex].cancelado = true;
            localStorage.setItem('turnosReservados', JSON.stringify(turnos));
        }
        
        // Recargar lista
        turnosReservados = turnos;
        cargarTurnosReservados();
        mostrarMensaje('Turno cancelado exitosamente', 'exito');
    }
}

// Mostrar mensajes al usuario
function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje-reserva');
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje mensaje-${tipo}`;
    
    // Desplazarse suavemente al mensaje
    mensajeDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        mensajeDiv.textContent = '';
        mensajeDiv.className = 'mensaje';
    }, 5000);
}

// Formatear fecha para mostrar
function formatearFecha(fechaStr) {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Actualizar datos de barberos desde localStorage
function actualizarDatosBarberos() {
    const datosGuardados = localStorage.getItem('barberos');
    if (datosGuardados) {
        barberos = JSON.parse(datosGuardados);
        cargarBarberos();
        cargarSelectBarberos();
        actualizarContadorDisponibles();
    }
}

// Escuchar cambios en localStorage (para sincronización entre pestañas)
window.addEventListener('storage', function(e) {
    if (e.key === 'barberos') {
        actualizarDatosBarberos();
    }
});