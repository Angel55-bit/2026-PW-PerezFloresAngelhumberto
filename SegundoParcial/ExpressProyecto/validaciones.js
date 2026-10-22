//vamos a tener funciones que se encargan de validar correo boleta y contraseña

//wiiiii mas tarea siiiiiii

//aqui va funcion de correo
function validarCorreo(correo){
    if (typeof correo !== 'string') return false;
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexCorreo.test(correo);
}

//aqui va funcion de boleta
function validarBoleta(boleta){
    if (typeof boleta !== 'string' && typeof boleta !== 'number') return false;
    const boletaStr = String(boleta);
    const regexBoleta = /^[0-9]{10}$/;
    return regexBoleta.test(boletaStr);
}

//aqui va funcion de contraseña
function validarContraseña(contraseña){
    if (typeof contraseña !== 'string') return false;
    return contraseña.length >= 8;
}

module.exports = {validarCorreo, validarBoleta, validarContraseña};