// ============================================
// AUTHGUARD.JS - Guardia de seguridad para Panel de Barberos (VERSIÓN MEJORADA)
// ============================================

(async () => {
  console.log('🔐 Verificando autenticación para panel de barberos...');
  
  const db = window.db;

  try {
    // 1. Obtener sesión actual
    const { data: { session }, error: sessionError } = await db.auth.getSession();

    // 2. Si NO hay sesión, redirigir INMEDIATAMENTE
    if (!session) {
      console.log('❌ No hay sesión activa - redirigiendo a login');
      // ⚡ replace() evita que "atrás" vuelva a esta página
      window.location.replace('login.html');
      return;
    }

    // 3. Verificar rol del usuario
    const { data: perfil, error: perfilError } = await db
      .from('profiles')
      .select('rol')
      .eq('id', session.user.id)
      .single();

    // 4. Si hay error al obtener el perfil
    if (perfilError) {
      console.error('❌ Error al obtener perfil:', perfilError);
      await db.auth.signOut();
      window.location.replace('login.html');
      return;
    }

    // 5. Si no es barbero, denegar acceso
    if (!perfil || perfil.rol !== 'barbero') {
      console.log('❌ Acceso denegado - rol incorrecto (requerido: barbero)');
      await db.auth.signOut();
      window.location.replace('login.html');
      return;
    }

    // 6. ✅ Acceso autorizado
    console.log('✅ Acceso autorizado como barbero');
    
  } catch (error) {
    // 7. Error inesperado
    console.error('❌ Error crítico en authGuard:', error);
    await db.auth.signOut();
    window.location.replace('login.html');
  }
})();