import {
    verificarSesion,
    registrarUsuario,
    iniciarSesion,
    cerrarSesion,
    usuarioActual
} from './auth.js';
import {
    obtenerJuegosBD,
    obtenerJuegoPorIdBD,
    obtenerComentariosBD,
    subirPortadaStorage,
    crearJuegoBD,
    editarJuegoBD,
    eliminarJuegoBD,
    agregarComentarioBD
} from './juegos.js';

const seccionAuth = document.getElementById('seccion-auth');
const seccionFormulario = document.getElementById('seccion-formulario');
const infoUsuario = document.getElementById('info-usuario');
const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
const formAuth = document.getElementById('form-auth');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnIniciarSesion = document.getElementById('btn-iniciar-sesion');
const btnRegistrarse = document.getElementById('btn-registrarse');
const mensajeAuth = document.getElementById('mensaje-auth');

const formRecomendacion = document.getElementById('form-recomendacion');
const juegoId = document.getElementById('juego-id');
const titulo = document.getElementById('titulo');
const genero = document.getElementById('genero');
const puntuacion = document.getElementById('puntuacion');
const portadaFile = document.getElementById('portada-file');
const resenia = document.getElementById('resenia');
const plataforma = document.getElementById('plataforma');
const anio = document.getElementById('anio');
const terminado = document.getElementById('terminado');
const mensaje = document.getElementById('mensaje');
const tituloForm = document.getElementById('titulo-form');
const gridJuegos = document.getElementById('grid-juegos');

function mostrarMensaje(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = tipo === 'ok' ? 'mensaje-ok' : 'mensaje-error';
}

function nombreDeEmail(email) {
    if (!email || !email.includes('@')) return 'Anónimo';
    return email.split('@')[0];
}

function actualizarUI(usuario) {
    if (usuario) {
        seccionAuth.hidden = true;
        seccionFormulario.hidden = false;
        btnCerrarSesion.hidden = false;
        infoUsuario.textContent = 'Hola, ' + nombreDeEmail(usuario.email);
    } else {
        seccionAuth.hidden = false;
        seccionFormulario.hidden = true;
        btnCerrarSesion.hidden = true;
        infoUsuario.textContent = '';
        formAuth.reset();
    }
}

async function cargarJuegos() {
    const juegosRes = await obtenerJuegosBD();
    if (juegosRes.error) {
        console.error('Error al cargar juegos:', juegosRes.error.message);
        return;
    }
    let comentariosRes;
    try {
        comentariosRes = await obtenerComentariosBD();
    } catch (e) {
        console.error('Error al cargar comentarios:', e.message);
        comentariosRes = { data: null, error: e };
    }
    gridJuegos.textContent = '';
    if (!juegosRes.data) return;
    const comentariosPorJuego = new Map();
    if (comentariosRes.data) {
        for (const comentario of comentariosRes.data) {
            const lista = comentariosPorJuego.get(comentario.juego_id) || [];
            lista.push(comentario);
            comentariosPorJuego.set(comentario.juego_id, lista);
        }
    }
    juegosRes.data.forEach((juego) => {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'tarjeta-form';
        const img = document.createElement('img');
        img.src = juego.url_portada;
        img.alt = juego.titulo;
        const h3 = document.createElement('h3');
        h3.textContent = juego.titulo;
        const pGenero = document.createElement('p');
        pGenero.textContent = 'Género: ' + juego.genero;
        const pPuntuacion = document.createElement('p');
        pPuntuacion.textContent = 'Puntuación: ' + juego.puntuacion + '/10';
        const pResenia = document.createElement('p');
        pResenia.textContent = juego.resenia;
        const pRecomendado = document.createElement('p');
        pRecomendado.textContent = 'Recomendado por: ' + nombreDeEmail(juego.user_email);
        tarjeta.appendChild(img);
        tarjeta.appendChild(h3);
        tarjeta.appendChild(pGenero);
        tarjeta.appendChild(pPuntuacion);
        tarjeta.appendChild(pResenia);
        tarjeta.appendChild(pRecomendado);
        const esAutor = usuarioActual && usuarioActual.email === juego.user_email;
        if (esAutor) {
            const btnEditar = document.createElement('button');
            btnEditar.type = 'button';
            btnEditar.textContent = 'Editar';
            btnEditar.addEventListener('click', () => prepararEdicion(juego.id));
            const btnEliminar = document.createElement('button');
            btnEliminar.type = 'button';
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.addEventListener('click', () => eliminarJuego(juego.id));
            tarjeta.appendChild(btnEditar);
            tarjeta.appendChild(btnEliminar);
        }
        const seccionComentarios = document.createElement('div');
        seccionComentarios.className = 'seccion-comentarios';
        const h4 = document.createElement('h4');
        const comentarios = comentariosPorJuego.get(juego.id) || [];
        h4.textContent = 'Comentarios (' + comentarios.length + ')';
        seccionComentarios.appendChild(h4);
        if (comentarios.length > 0) {
            const lista = document.createElement('div');
            comentarios.forEach((comentario) => {
                const item = document.createElement('div');
                item.className = 'comentario-item';
                const autor = document.createElement('strong');
                autor.textContent = nombreDeEmail(comentario.user_email);
                const texto = document.createElement('p');
                texto.textContent = comentario.texto;
                item.appendChild(autor);
                item.appendChild(texto);
                lista.appendChild(item);
            });
            seccionComentarios.appendChild(lista);
        } else {
            const sinComentarios = document.createElement('p');
            sinComentarios.className = 'sin-comentarios';
            sinComentarios.textContent = 'Sin comentarios todavía.';
            seccionComentarios.appendChild(sinComentarios);
        }
        if (usuarioActual) {
            const formComentario = document.createElement('div');
            formComentario.className = 'form-comentario';
            const inputComentario = document.createElement('input');
            inputComentario.type = 'text';
            inputComentario.placeholder = 'Escribí un comentario...';
            const btnComentar = document.createElement('button');
            btnComentar.type = 'button';
            btnComentar.className = 'btn-comentar';
            btnComentar.textContent = 'Enviar';
            const pErrorComentario = document.createElement('p');
            pErrorComentario.className = 'mensaje-error';
            pErrorComentario.textContent = '';
            btnComentar.addEventListener('click', async () => {
                const texto = inputComentario.value.trim();
                if (!texto) {
                    pErrorComentario.textContent = 'Escribí algo antes de enviar';
                    return;
                }
                pErrorComentario.textContent = '';
                const { error } = await agregarComentarioBD(juego.id, texto, usuarioActual.email);
                if (error) {
                    pErrorComentario.textContent = 'No se pudo enviar el comentario: ' + error.message;
                    return;
                }
                inputComentario.value = '';
                cargarJuegos();
            });
            formComentario.appendChild(inputComentario);
            formComentario.appendChild(btnComentar);
            formComentario.appendChild(pErrorComentario);
            seccionComentarios.appendChild(formComentario);
        } else {
            const aviso = document.createElement('p');
            aviso.className = 'aviso-login-comentario';
            aviso.textContent = 'Iniciá sesión para comentar.';
            seccionComentarios.appendChild(aviso);
        }
        tarjeta.appendChild(seccionComentarios);
        gridJuegos.appendChild(tarjeta);
    });
}

async function prepararEdicion(id) {
    const { data, error } = await obtenerJuegoPorIdBD(id);
    if (error || !data) {
        mostrarMensaje(mensaje, 'No se pudo cargar el juego para editar', 'error');
        return;
    }
    juegoId.value = data.id;
    titulo.value = data.titulo;
    genero.value = data.genero;
    puntuacion.value = data.puntuacion;
    resenia.value = data.resenia;
    plataforma.value = data.plataforma;
    anio.value = data.anio || '';
    terminado.checked = data.terminado || false;
    portadaFile.required = false;
    tituloForm.textContent = 'Editar recomendación';
    mostrarMensaje(mensaje, '', 'ok');
}

function cancelarEdicion() {
    juegoId.value = '';
    formRecomendacion.reset();
    portadaFile.required = true;
    tituloForm.textContent = 'Publicar una recomendación';
    mostrarMensaje(mensaje, '', 'ok');
}

async function eliminarJuego(id) {
    const confirmacion = confirm('¿Seguro que querés eliminar esta recomendación?');
    if (!confirmacion) return;
    const { data, error } = await eliminarJuegoBD(id);
    if (error) {
        mostrarMensaje(mensaje, 'No se pudo eliminar el juego', 'error');
        return;
    }
    if (!data || data.length === 0) {
        mostrarMensaje(mensaje, 'No tenés permiso para modificar esta recomendación', 'error');
        return;
    }
    mostrarMensaje(mensaje, 'Juego eliminado', 'ok');
    cancelarEdicion();
    cargarJuegos();
}

btnRegistrarse.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (!email || !password) {
        mostrarMensaje(mensajeAuth, 'Completá email y contraseña', 'error');
        return;
    }
    const { error } = await registrarUsuario(email, password);
    if (error) {
        mostrarMensaje(mensajeAuth, 'No se pudo registrar: ' + error.message, 'error');
        return;
    }
    mostrarMensaje(mensajeAuth, 'Registro exitoso. Ya podés iniciar sesión', 'ok');
});

btnIniciarSesion.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;
    const { data, error } = await iniciarSesion(email, password);
    if (error) {
        mostrarMensaje(mensajeAuth, 'No se pudo iniciar sesión: ' + error.message, 'error');
        return;
    }
    actualizarUI(data.user);
    cargarJuegos();
});

btnCerrarSesion.addEventListener('click', async () => {
    await cerrarSesion();
    cancelarEdicion();
    actualizarUI(null);
    cargarJuegos();
});

formRecomendacion.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!usuarioActual) {
        mostrarMensaje(mensaje, 'Tenés que iniciar sesión para publicar', 'error');
        return;
    }
    try {
        let portadaUrl = '';
        if (portadaFile.files.length > 0) {
            portadaUrl = await subirPortadaStorage(portadaFile.files[0]);
        }
        const datos = {
            titulo: titulo.value.trim(),
            genero: genero.value,
            puntuacion: Number(puntuacion.value),
            url_portada: portadaUrl,
            resenia: resenia.value.trim(),
            plataforma: plataforma.value,
            anio: anio.value || null,
            terminado: terminado.checked
        };
        if (juegoId.value) {
            const { data, error } = await editarJuegoBD(juegoId.value, datos);
            if (error) {
                mostrarMensaje(mensaje, 'No se pudo editar el juego', 'error');
                return;
            }
            if (!data || data.length === 0) {
                mostrarMensaje(mensaje, 'No tenés permiso para modificar esta recomendación', 'error');
                return;
            }
            mostrarMensaje(mensaje, 'Juego editado', 'ok');
        } else {
            datos.user_email = usuarioActual.email;
            const { error } = await crearJuegoBD(datos);
            if (error) {
                mostrarMensaje(mensaje, 'No se pudo publicar el juego', 'error');
                return;
            }
            mostrarMensaje(mensaje, 'Recomendación publicada', 'ok');
        }
        cancelarEdicion();
        cargarJuegos();
    } catch (error) {
        mostrarMensaje(mensaje, 'Error al guardar: ' + error.message, 'error');
    }
});

verificarSesion((usuario) => {
    actualizarUI(usuario);
    cargarJuegos();
});
