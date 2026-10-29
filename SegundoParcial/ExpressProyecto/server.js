const express = require('express')

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = require('./db-local');

const PORT = 4000;

const usuarios_controlador = require('./Controlador/usuarios_controlador');
const talleres_controlador = require('./Controlador/talleres_controlador');
const asistencias_controlador = require('./Controlador/asistencias_controlador');


app.get('/', (req, res)  => {
    res.json({mensaje: 'Quedo por fin'});
});

//tenemos la ruta principal por medio del metodo get 
app.get('/saludo', (req, res) => {
    res.json({mensaje:'Hola esto es una prueba en GET'});
});

//rutas por medio del metodo post, como un endpoint propio
app.post('/eco', (req, res) =>{
    const {texto} = req.body || {};
    if(!texto){
        return res.status(400).json({error:'El texto es oblogatorio'});
    }
    res.status(201).json({eco:texto});
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto: ${PORT}`);
})

app.get('./usuarios', usuarios_controlador.listarUsuarios);
app.get('/usuarios/:id', usuarios_controlador.obtenerUsuario);
app.post('/usuarios', usuarios_controlador.crearUsuario);
app.put('/usuarios/:id', usuarios_controlador.actualizarUsuario);
app.delete('/usuarios/:id', usuarios_controlador.eliminarUsuario);
 

app.get('/usuarios/:id/talleres', talleres_controlador.listarTalleresDeUsuario);
app.get('/usuarios/:id/asistencias', asistencias_controlador.listarAsistenciaUsuario);
 
 

app.get('/talleres', talleres_controlador.listarTalleres);
app.get('/talleres/:id', talleres_controlador.obtenerTaller);
app.post('/talleres', talleres_controlador.crearTaller);
app.put('/talleres/:id', talleres_controlador.actualizarTaller);
app.delete('/talleres/:id', talleres_controlador.eliminarTaller);
 

app.post('/talleres/:id/inscripciones', talleres_controlador.inscribirseEnTaller);
app.get('/talleres/:id/inscritos', talleres_controlador.listarInscritosTaller);
 
 

app.post('/asistencias', asistencias_controlador.registrarAsistencia);
app.get('/talleres/:id/asistencias', asistencias_controlador.listarAsistenciaTaller);