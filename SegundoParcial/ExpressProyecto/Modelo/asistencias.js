const pool = require('../db-local');

const COLUMNAS_ASISTENCIA = 'id, usuario_id, taller_id, fecha';

async function registrarAsistencia({usuarioId, tallerId, fecha}) {
    const fechaAsistencia = fecha || new Date ();
    const [info] = await pool.query(`INSERT INTO asistencias (usuario_id, taller_id, fecha) VALUES (?, ?, ?)`,
        [usuarioId, tallerId, fechaAsistencia]
    );
    return { id: info.insertId, usuarioId, tallerId, fecha: fechaAsistencia};

}

async function consultarlistaAsistencia(tallerId) {
    let query = `SELECT ${COLUMNAS_ASISTENCIA} FROM asistencias`;
    const params = [];

    if (tallerId) {
        query += `WHERE taller_id = ?`;
        params.push(tallerId);
    }

    query += `ORDER BY id`;
    const [filas] = await pool.query(query, params);
    return filas;
}

module.exports = {registrarAsistencia, consultarlistaAsistencia};