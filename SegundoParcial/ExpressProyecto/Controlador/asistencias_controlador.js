const asistenciasModel = require('../Modelo/asistencias');

function esDuplicado(error){
    return error.code === 'ER_DUP_ENTRY' || error.code === '23505';
}

async function listarAsistencias(req, res) {
    try{
        const { taller_id } = req.query;
        const asistencias = await asistenciasModel.consultarListaAsistencia(taller_id);
        res.json(asistencias);
    }catch (error){
        res.status(500).json({error: error.mensaje});
    }
}

async function obtenerAsistencia(req, res) {
    try{
        const asistencia = await asistenciasModel.obtenerPorId(req.params.id);
        if (!asistencia) return res.status(404).json({error: 'Asistencia no encontrada'});
        res.json(asistencia);
    }catch(error){
        res.status(500).json({error: error.mensaje});
    }
}

async function registrarAsistenciaControlador(req, res) {
    const { usuarioId, tallerId, fecha } = req.body;
    
    if (!usuarioId || !tallerId) {
        return res.status(400).json({ error: 'usuarioId y tallerId son obligatorios, favor de verificar los datos' });
    }

    try {
        const asistencia = await asistenciasModel.registrarAsistencia({ usuarioId, tallerId, fecha });
        res.status(201).json(asistencia);
    } catch (error) {
        if (esDuplicado(error)) return res.status(409).json({ error: 'Ya existe un registro de asistencia para este usuario en el taller' });
        res.status(500).json({ error: error.message });
    }
}

async function eliminarAsistencia(req, res) {
    try {
        const eliminado = await asistenciasModel.eliminar(req.params.id);
        if (!eliminado) return res.status(404).json({ error: 'Asistencia no encontrada' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {listarAsistencias, obtenerAsistencia, registrarAsistenciaControlador, eliminarAsistencia};