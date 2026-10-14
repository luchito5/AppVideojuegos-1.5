import { supabase } from './supabaseClient.js';

// Usuario con sesión activa, o null si no hay ninguno
export let usuarioActual = null;

// Revisa si ya hay sesión abierta y avisa al resto de la app
export async function verificarSesion(alCambiarEstado) {
    try {
        const { data } = await supabase.auth.getSession();
        usuarioActual = data.session ? data.session.user : null;
        alCambiarEstado(usuarioActual);
    } catch (error) {
        console.error('Error al verificar la sesión:', error.message);
        usuarioActual = null;
        alCambiarEstado(null);
    }
}

// Crea una cuenta nueva en Supabase
export async function registrarUsuario(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
}

// Entra con email y contraseña; deja listo usuarioActual si sale bien
export async function iniciarSesion(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
            usuarioActual = data.user;
        }
        return { data, error };
    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);
        return { data: null, error };
    }
}

// Sale de la cuenta y olvida al usuario
export async function cerrarSesion() {
    try {
        await supabase.auth.signOut();
        usuarioActual = null;
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
    }
}
