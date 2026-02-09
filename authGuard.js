(async () => {
  const db = window.db;

  const { data: { session } } = await db.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const { data: perfil, error } = await db
    .from('profiles')
    .select('rol')
    .eq('id', session.user.id)
    .single();

  if (error || perfil.rol !== 'barbero') {
    alert('Acceso denegado');
    await db.auth.signOut();
    window.location.href = 'login.html';
  }
})();
