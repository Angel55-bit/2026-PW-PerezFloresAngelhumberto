const talleresModel = require('../Modelo/talleres');

function esDuplicado(error){
    return error.code === 'ER_DUP_ENTRY' || error.code === '23505';
}

async function listarTalleres(req, res) {
    try{
        const talleres = await talleresModel.listar();
        res.json(talleres);
    } catch (error){
        res.status(500).json({error: error.mensaje});
    }
}

async function obtenerTaller(req, res) {
    try{
        const talleres = await talleresModel.obtenerPorId(req.params.id);
        if (!taller) return res.status(404).json({error: 'Taller no encontrado'});
        res.json(talleres);
    } catch (error){
        res.status(500).json({error: error.mensaje});
    }
}

async function crearTaller(req, res) {
    const { nombre, descripcion, horario, cupo } = req.body;
    
    if (!nombre || !descripcion || !horario || !cupo) {
        return res.status(400).json({ error: 'nombre, descripcion, horario y cupo son obligatorios, favor de verificar los datos' });
    }

    try {
        const taller = await talleresModel.crear({ nombre, descripcion, horario, cupo });
        res.status(201).json(taller);
    } catch (error) {
        if (esDuplicado(error)) return res.status(409).json({ error: 'Ya existe un taller con ese nombre' });
        res.status(500).json({ error: error.message });
    }
}

async function actualizarTaller(req, res) {
    const {nombre, descripcion, horario, cupo} = req.body;
    if(nombre === undefined && descripcion === undefined && horario === undefined && cupo === undefined){
        return res.status(400).json({error: 'Debe ingresar alguno de los siguientes datos para actualizar: nombre, descripcion, horario o cupo'});
    }
    try{
        const taller = await talleresModel.actualizar(req.params.id, {nombre, descripcion, horario, cupo});
        if(taller) return res.status(404).json({error: 'Taller no encontrado'});
        res.json(taller);
    }catch (error){
        if(esDuplicado(error)) return res.status(409).json({error: 'Ya existe un taller con ese nombre, ingresa uno diferente'});
        res.status(500).json({error: mensaje});
    }
}

async function eliminarTaller(req, res) {
    try{
        const eliminado = await talleresModel.eliminar(req.params.id);
        if(!eliminado) return res.status(404).json({error: 'Taller no encontrado'});
        res.status(204).send();
    }catch (error){
        res.status(500).json({error: error.mensaje});
    }
}

module.exports = {listarTalleres, obtenerTaller, crearTaller, actualizarTaller, eliminarTaller};