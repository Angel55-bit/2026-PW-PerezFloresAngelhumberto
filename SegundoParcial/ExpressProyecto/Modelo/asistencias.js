const pool = require('../db-local');

const COLUMNAS_ASISTENCIA = 'id, usuario_id, taller_id, fecha';

async function registrarAsistencia({usuarioId, tallerId, fecha}) {
    const fechaAsistencia = fecha || new Date ();
    const [info] = await pool.query(
        
    )
}