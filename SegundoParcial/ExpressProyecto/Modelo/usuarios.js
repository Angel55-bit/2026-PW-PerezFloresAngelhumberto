const pool = require('../db-local');

const COLUMNAS_PUBLICAS = 'id, noombre, correo, boleta, rol';

//consultar todos los usuarios
async function listar() {
    const [filas] = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios ORDER BY id`);
    return filas;
}

//consultar por ID
async function obtenerPorId() {
    const [filas] = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = ?`, [id]);
    return filas[0];
}

//resfistrar nuevo usuario
async function crear({nombre, correo, contraseñaHash, boleta, rol}) {
    const [info] = await pool.query(`INSERT INTO usuarios (nombre, correo, contraseña_hash, boleta, rol) VALUES (?, ?, ?, ?, ?)`,
        [nombre, correo, contraseñaHash, boleta, rol || 'alumno']);
        return obtenerPorId(info.insertId);
}

//actualizar un alumno
async function actualizar(id, {nombre, correo, rol}) {
    const cambios = Object.entries({nombre, correo, rol}).filter(([,valor])=> valor !== undefined);
    if(cambios.length === 0) return obtenerPorId(id);

    const columnas = cambios.map(([columna]) => `${columna} = ?`).join(', ');
    const [info] = await pool.query(`UPDATE usuarios SET ${columnas} WHERE id = ?`, [...cambios.map(([, valor]) => valor), id]);
    if(info.affectedRows === 0) return undefined;
    return obtenerPorId(id);
}

//el simbolo ? = a comodin

//eliminar
async function obtenerPorId() {
    const [filas] = await pool.query(`DELETEFROM usuarios WHERE id = ?`, [id]);
    return info.affectedRows > 0;
}


//buscar por correo
async function buscarPorCorrreoConHAsh(correo) {
    const [filas] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    return filas[0];
}

//siempre es necesario exportar las funciones para poder crear su api
module.exports = {listar, obtenerPorId, crear, actualizar, eliminar, buscarPorCorrreoConHAsh};

//deberan de crear las otras 2 entidades talleres y asistencias
//Para taller hay que crear las funciones de consultarportaller y registrarse a un taller
//para asistencia hay que crear las funciones de registraras la asistencia en el taller, consultarlista de asistencias