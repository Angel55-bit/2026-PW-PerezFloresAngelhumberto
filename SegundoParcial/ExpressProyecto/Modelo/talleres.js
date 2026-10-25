const pool = require('../db-local');

const COLUMNAS_TALLERES = 'id, nombre, descripción, horario, cupo';

async function listar() {
    const [filas] = await pool.query(`SELECT ${COLUMNAS_TALLERES} FROM talleres ORDER BY id`);
    return filas;
}

async function consultarportaller(id) {
    const [filas] = await pool.query(`SELECT ${COLUMNAS_TALLERES} FROM talleres WHERE id = ?`, [id]);
    return filas[0];
}

async function registrarseATaller({ usuarioId, tallerId}) {
    const [info] = await pool.query(
        `INSERT INTO registros_talleres (usuario_id, taller_id) VALUES (?, ?)`,
        [usuarioId, tallerId]
    );
    return {idRegistro: info.insertId, usuarioId, tallerId};
}

module.exports = {listar, consultarportaller, registrarseATaller};