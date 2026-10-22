//vamos a tener funciones que se encargan de validar correo boleta y contraseña

//wiiiii mas tarea siiiiiii

//aqui va funcion de correo
function validarCorreo(correo){

}

//aqui va funcion de boleta
function validarBoleta(boleta){

}

//aqui va funcion de contraseña
function validarContraseña(contraseña){
    if (typeof contraseña !== 'string') return false;
    return contraseña.length >= 8;
}

module.exports = {validarCorreo, validarBoleta, validarContraseña};