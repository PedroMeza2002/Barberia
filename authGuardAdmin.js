// ============================================
// AUTHGUARDADMIN.JS - Guardia de seguridad para Panel de Admin (VERSIÓN MEJORADA)
// ============================================

console.log('🔐 Verificando autenticación para panel de admin...');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Verificar sesión
        const { data: { session }, error: sessionError } = await window.db.auth.getSession();

        // 2. Si NO hay sesión, redirigir INMEDIATAMENTE
        if (!session) {
            console.log('❌ No hay sesión activa - redirigiendo a login');
            // ⚡ replace() evita que "atrás" vuelva a esta página
            window.location.replace('login.html');
            return;
        }

        // 3. Verificar rol
        const { data: profile, error: profileError } = await window.db
            .from('profiles')
            .select('rol')
            .eq('id', session.user.id)
            .single();

        // 4. Si hay error al obtener el perfil
        if (profileError) {
            console.error('❌ Error al obtener perfil:', profileError);
            await window.db.auth.signOut();
            window.location.replace('login.html');
            return;
        }

        // 5. Si no es admin, denegar acceso
        if (!profile || profile.rol !== 'admin') {
            console.log('❌ Acceso denegado - rol incorrecto (requerido: admin)');
            await window.db.auth.signOut();
            window.location.replace('login.html');
            return;
        }

        // 6. ✅ Acceso autorizado
        console.log('✅ Admin autorizado');
        
    } catch (error) {
        // 7. Error inesperado
        console.error('❌ Error crítico en authGuardAdmin:', error);
        await window.db.auth.signOut();
        window.location.replace('login.html');
    }
});