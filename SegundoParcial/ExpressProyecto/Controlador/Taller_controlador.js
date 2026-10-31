const talleresModel = require('../Modelo/talleres');
const usuariosModel = require('../Modelo/usuarios');

//que pasa si el nombre del taller o la inscripcion se duplica
function esDuplicado(error){
    return error.code === 'ER_DUP_ENTRY' || error.code === '23505';
}

function idValido(valor){
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0;
}

function cupoValido(cupo){
    return Number.isInteger(cupo) && cupo > 0;
}

function nombreValido(nombre){
    return typeof nombre === 'string' && nombre.trim().length > 0;
}

function instructorValido(instructor){
    return typeof instructor === 'string'
        && /^[A-Za-zÁÉÍÓÚáéíóúÑñ.\s]+$/.test(instructor.trim())
        && instructor.trim().length > 0;
}

function fechaInicioValida(fecha){
    if(typeof fecha !== 'string') return false;
    const fechaFormateada = fecha.trim();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(fechaFormateada)) return false;

    const fechaObj = new Date(fechaFormateada + 'T00:00:00');
    if(Number.isNaN(fechaObj.getTime())) return false;

    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    const fechaMaxima = new Date('2030-12-31T00:00:00');

    return fechaObj >= fechaActual && fechaObj <= fechaMaxima;
}

async function listarTalleres(req, res) {
    try{
        const talleres = await talleresModel.listar();
        res.json(talleres);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function obtenerTaller(req, res) {
    if(!idValido(req.params.id)) return res.status(404).json({error: 'Taller no encontrado'});

    try{
        const taller = await talleresModel.obtenerPorId(req.params.id);
        if(!taller) return res.status(404).json({error: 'Taller no encontrado'});
        res.json(taller);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function crearTaller(req, res) {
    const {nombre, descripcion, cupo} = req.body;
    const fecha_inicio = req.body.fecha_inicio ?? req.body.fecha;
    const imparte = req.body.imparte ?? req.body.instructor;

    if(!nombre || !fecha_inicio){
        return res.status(400).json({error: 'nombre y fecha son obligatorios'});
    }
    if(!nombreValido(nombre)) return res.status(400).json({error: 'El nombre del taller no es valido'});
    if(cupo === undefined) return res.status(400).json({error: 'El cupo es obligatorio'});
    if(!cupoValido(cupo)) return res.status(400).json({error: 'El cupo debe ser un numero entero mayor a 0'});
    if(!fechaInicioValida(fecha_inicio)) return res.status(400).json({error: 'La fecha de inicio debe estar entre hoy y el 31/12/2030'});
    if(imparte !== undefined && !instructorValido(imparte)) return res.status(400).json({error: 'El nombre del instructor no es valido'});

    try{
        const taller = await talleresModel.crear({
            nombre: nombre.trim(),
            descripcion,
            cupo,
            fecha_inicio,
            imparte: imparte.trim()
        });
        res.status(201).json(taller);
    }catch(error){
        if(esDuplicado(error)) return res.status(409).json({error: 'Ya existe un taller con ese nombre'});
        res.status(500).json({error: error.message});
    }
}

async function actualizarTaller(req, res) {
    const {nombre, descripcion, cupo} = req.body;
    const fecha_inicio = req.body.fecha_inicio ?? req.body.fecha;
    const imparte = req.body.imparte ?? req.body.instructor;

    if(!idValido(req.params.id)) return res.status(400).json({error: 'El id del taller no es valido'});

    if(nombre === undefined && descripcion === undefined && cupo === undefined && fecha_inicio === undefined && imparte === undefined){
        return res.status(400).json({error: 'Debe de ingresar alguno de los siguientes datos para actualizar: nombre, descripcion, cupo, fecha_inicio o imparte'});
    }
    if(nombre !== undefined && !nombreValido(nombre)){
        return res.status(400).json({error: 'El nombre del taller no es valido'});
    }
    if(cupo !== undefined && !cupoValido(cupo)){
        return res.status(400).json({error: 'El cupo debe ser un numero entero mayor a 0'});
    }
    if(fecha_inicio !== undefined && !fechaInicioValida(fecha_inicio)){
        return res.status(400).json({error: 'La fecha de inicio debe estar entre hoy y el 31/12/2030'});
    }
    if(imparte !== undefined && !instructorValido(imparte)){
        return res.status(400).json({error: 'El nombre del instructor no es valido'});
    }

    try{
  
        if(cupo !== undefined){
            const inscritos = (await talleresModel.listarInscritos(req.params.id)).length;
            if(cupo < inscritos){
                return res.status(409).json({error: `Ya hay ${inscritos} alumnos inscritos, el cupo no puede ser menor`});
            }
        }

        const taller = await talleresModel.actualizar(req.params.id, {
            nombre: nombre !== undefined ? nombre.trim() : undefined,
            descripcion,
            cupo,
            fecha_inicio: fecha_inicio !== undefined ? fecha_inicio.trim() : undefined,
            imparte: imparte !== undefined ? imparte.trim() : undefined
        });
        if(!taller) return res.status(404).json({error: 'Taller no encontrado'});
        res.json(taller);
    }catch(error){
        if(esDuplicado(error)) return res.status(409).json({error: 'Ya existe un taller con ese nombre, ingresa uno diferente'});
        res.status(500).json({error: error.message});
    }
}

async function eliminarTaller(req, res) {
    if(!idValido(req.params.id)) return res.status(400).json({error: 'El id del taller no es valido'});

    try{
        const eliminado = await talleresModel.eliminar(req.params.id);
        if(!eliminado) return res.status(404).json({error: 'Taller no encontrado'});
        res.status(204).send();
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

//registrarse en un taller
async function inscribirseEnTaller(req, res) {
    const tallerId = req.params.id;
    const {usuarioId} = req.body;

    if(!idValido(tallerId) || !idValido(usuarioId)){
        return res.status(400).json({error: 'El id del taller y el usuarioId son obligatorios y deben ser validos'});
    }

    try{
        const taller = await talleresModel.obtenerPorId(tallerId);
        if(!taller) return res.status(404).json({error: 'Taller no encontrado'});

        const usuario = await usuariosModel.obtenerPorId(usuarioId);
        if(!usuario) return res.status(404).json({error: 'Usuario no encontrado'});

        if(await talleresModel.estaInscrito(usuarioId, tallerId)){
            return res.status(409).json({error: 'El usuario ya esta inscrito en este taller'});
        }

        if(await talleresModel.tieneInscripcion(usuarioId)){
            return res.status(409).json({error: 'El usuario ya tiene una inscripción activa en otro taller'});
        }

        const inscritos = (await talleresModel.listarInscritos(tallerId)).length;
        if(inscritos >= taller.cupo){
            return res.status(409).json({error: 'El taller ya no tiene cupo disponible'});
        }

        const inscripcion = await talleresModel.inscribir(usuarioId, tallerId);
        res.status(201).json(inscripcion);
    }catch(error){
        if(esDuplicado(error)) return res.status(409).json({error: 'El usuario ya esta inscrito en este taller'});
        res.status(500).json({error: error.message});
    }
}


async function listarInscritosTaller(req, res) {
    if(!idValido(req.params.id)) return res.status(400).json({error: 'El id del taller no es valido'});

    try{
        const taller = await talleresModel.obtenerPorId(req.params.id);
        if(!taller) return res.status(404).json({error: 'Taller no encontrado'});

        const inscritos = await talleresModel.listarInscritos(req.params.id);
        res.json(inscritos);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}


async function listarTalleresDeUsuario(req, res) {
    if(!idValido(req.params.id)) return res.status(400).json({error: 'El id del usuario no es valido'});

    try{
        const usuario = await usuariosModel.obtenerPorId(req.params.id);
        if(!usuario) return res.status(404).json({error: 'Usuario no encontrado'});

        const talleres = await talleresModel.listarPorUsuario(req.params.id);
        res.json(talleres);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

module.exports = {
    listarTalleres,
    obtenerTaller,
    crearTaller,
    actualizarTaller,
    eliminarTaller,
    inscribirseEnTaller,
    listarInscritosTaller,
    listarTalleresDeUsuario
};