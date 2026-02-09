document.addEventListener('DOMContentLoaded', () => {
    console.log('login.js cargado');

    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        errorMsg.style.display = 'none';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            errorMsg.textContent = 'Completá todos los campos';
            errorMsg.style.display = 'block';
            return;
        }

        // 1️⃣ Login
        const { data, error } = await window.db.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            errorMsg.textContent = 'Correo o contraseña incorrectos';
            errorMsg.style.display = 'block';
            return;
        }

        // 2️⃣ Obtener rol
        const { data: profile, error: profileError } = await window.db
            .from('profiles')
            .select('rol')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            errorMsg.textContent = 'No se pudo verificar el rol';
            errorMsg.style.display = 'block';
            await window.db.auth.signOut();
            return;
        }

        // 3️⃣ Redirigir según rol
        if (profile.rol === 'admin') {
            window.location.href = 'admin.html';
        } else if (profile.rol === 'barbero') {
            window.location.href = 'PanelBarberos.html';
        } else {
            errorMsg.textContent = 'Rol no autorizado';
            errorMsg.style.display = 'block';
            await window.db.auth.signOut();
        }
    });
});

