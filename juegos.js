import { supabase } from './supabaseClient.js';

const NOMBRE_BUCKET = 'portadas';

export async function obtenerJuegosBD() {
    const { data, error } = await supabase
        .from('AppVideojuegos')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function obtenerJuegoPorIdBD(id) {
    const { data, error } = await supabase
        .from('AppVideojuegos')
        .select('*')
        .eq('id', id)
        .single();
    return { data, error };
}

export async function obtenerComentariosBD() {
    const { data, error } = await supabase
        .from('comentarios')
        .select('*')
        .order('created_at', { ascending: true });
    return { data, error };
}

export async function subirPortadaStorage(archivo) {
    const extension = archivo.name.split('.').pop();
    const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
    const { error } = await supabase.storage
        .from(NOMBRE_BUCKET)
        .upload(nombreUnico, archivo);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
        .from(NOMBRE_BUCKET)
        .getPublicUrl(nombreUnico);
    return publicUrl;
}

export async function crearJuegoBD(datos) {
    const { data, error } = await supabase
        .from('AppVideojuegos')
        .insert([datos]);
    return { data, error };
}

export async function editarJuegoBD(id, datos) {
    const { data, error } = await supabase
        .from('AppVideojuegos')
        .update(datos)
        .eq('id', id)
        .select();
    return { data, error };
}

export async function eliminarJuegoBD(id) {
    const { data, error } = await supabase
        .from('AppVideojuegos')
        .delete()
        .eq('id', id)
        .select();
    return { data, error };
}

export async function agregarComentarioBD(juegoId, texto, userEmail) {
    const { data, error } = await supabase
        .from('comentarios')
        .insert([{ juego_id: juegoId, texto: texto, user_email: userEmail }]);
    return { data, error };
}
