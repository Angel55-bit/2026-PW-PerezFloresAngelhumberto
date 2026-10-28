const express = require('express')

const app = express();

app.use(express.json());


const PORT = 4000;


app.get('/', (req, res)  => {
    res.json({mensaje: 'Quedo por fin'});
});

//tenemos la ruta principal por medio del metodo get 
app.get('/saludo', (req, res) => {
    res.json({mensaje:'Hola esto es una prueba en GET'});
});

//rutas por medio del metodo post, como un endpoint propio
app.post('/eco', (req, res) =>{
    const {texto} = req.body;
    if(!texto){
        return res.status(400).json({error:'El texto es oblogatorio'});
    }
    res.status(201).json({eco:texto})
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto: ${PORT}`);
})

app.get('/usuarios', usuarioControlador.listarUsuarios);
app.get('/usuarios/:id', usuarioControlador.obtenerUsuario);
app.post('/usuarios', usuarioControlador.crearUsuario);
app.put('/usuarios/:id', usuarioControlador.actualizarUsuario);
app.delete('/usuarios/:id', usuarioControlador.eliminarUsuario);
 

app.get('/usuarios/:id/talleres', tallerControlador.listarTalleresDeUsuario);
app.get('/usuarios/:id/asistencias', asistenciaControlador.listarAsistenciaUsuario);
 
 

app.get('/talleres', tallerControlador.listarTalleres);
app.get('/talleres/:id', tallerControlador.obtenerTaller);
app.post('/talleres', tallerControlador.crearTaller);
app.put('/talleres/:id', tallerControlador.actualizarTaller);
app.delete('/talleres/:id', tallerControlador.eliminarTaller);
 

app.post('/talleres/:id/inscripciones', tallerControlador.inscribirseEnTaller);
app.get('/talleres/:id/inscritos', tallerControlador.listarInscritosTaller);
 
 

app.post('/asistencias', asistenciaControlador.registrarAsistencia);
app.get('/talleres/:id/asistencias', asistenciaControlador.listarAsistenciaTaller);