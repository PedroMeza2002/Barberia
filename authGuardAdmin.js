console.log('authGuardAdmin.js cargado');

console.log('authGuardAdmin.js cargado');

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await window.db.auth.getUser();

    if (!user) {
        console.log('No hay sesión, redirigiendo a login');
        window.location.href = 'login.html';
        return;
    }

    const { data: profile, error } = await window.db
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        console.log('Error perfil, cerrando sesión');
        await window.db.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    if (profile.rol !== 'admin') {
        alert('Acceso no autorizado');
        await window.db.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    console.log('Admin autorizado');
});
