// La aplicación de la demo. server.js la arranca; las pruebas la arrancan con otras configuraciones.
// Lo que dice "(en clase)" lo programamos juntos, paso por paso. Mientras no esté, esa ruta responde 501.
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session); //Store es el almacenamiento, localstoras permanece en todos los navegadores
const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { crearModeloTokens } = require('./modelos/tokens.modelo');
const { error } = require('console');


const NOMBRE_COOKIE = 'connect.sid'; //toda cokkie tiene que tener un identificador, no tienen una estructura definida

//cokie se guarda en el navegador, las cokkies no tienen tiempo hasta que las borran

//tenemos que verificar y regresar todas las sesiones anteriores si es que existen en el almacen

// Regresa todas las sesiones del almacén (MemoryStore usa callback; MySQLStore regresa una promesa).
function todasLasSesiones(almacen) { //una promesa espera a que exista
  return new Promise((resolve, reject) => {
    const promesa = almacen.all((error, sesiones) => (error ? reject(error) : resolve(sesiones))); // o hay un error o unas sesiones
    if (promesa && typeof promesa.then === 'function') promesa.then(resolve, reject); // te preguntas si esa promesa es identica a la que estas creando entonces resuelve 
  }); //
}
//Si es la primera vez que entras crea la sesion, pero si no es tu primera vez inicia la sesion que ya tienes

// Se necesita generar una respuesta a esa promesa
// Respuesta para lo que todavía no programamos.
const pendiente = (paso) => (req, res) => res.status(501).json({ error: `501 · Falta programarlo en clase (paso ${paso})` });

// vamos por la conexion los usuaros siempre deben de leer la BD
// pool: la conexión a MySQL (db.js). Los usuarios SIEMPRE se leen de MySQL.
function crearApp(config, pool) {
  const app = express();
  app.use(express.json());
  //mandamos a traer el model
  const usuarios = crearModeloUsuarios(pool);
  const tokens = crearModeloTokens(pool);

  //aqui el servidor debe de recordar cada vez que existe una sesion para eeso vamos a ocupar el almacen
  // Aquí vive lo que el servidor recuerda de cada sesión:
  //  - 'mysql':   en la tabla sessions. Sobrevive a un reinicio y la puedes ver en Workbench.
  //  - 'memoria': en la memoria del proceso. Si el servidor se reinicia, se pierde todo.
  const almacen = config.almacen === 'memoria' ? new session.MemoryStore() : new MySQLStore({ createDatabaseTable: false, clearExpired: false }, pool); // uno es para guarda la galleta y otro para la sesion
  app.locals.almacen = almacen;

  app.use(
    session({
      name : NOMBRE_COOKIE,
      // aqui tenemos que definir si es secreta, si es publica o como es su acceso
      secret: process.env.SESSION_SECRET || 'secreto-solo-para-demo',
      resave : false,
      saveUninitialized: false,
      rolling : config.rolling,
      cookie: {
        maxAge: config.maxAgeMs ?? 1000 * 60 * 60 * 24, // 1 dia
        httpOnly: config.httpOnly ?? true,
        sameSite: config.sameSite ?? 'lax',
        secure: config.secure ?? false, // si es false va con cualquier tipo de protocolo de http
      }
    })
  )

  //necesitamos los primeros 8 caracteres del id de sesion, para compartirlos en pantalla para visualizarlos, en la realidad muy pocas veces se hace esto
  // Paso 1 (en clase): configurar express-session aquí, ANTES de las rutas.

  // Los primeros 8 caracteres del id de sesión, para poder compararlos en pantalla.
  const idCorto = (id) => (id ? `${id.slice(0, 8)}…` : null);

  //como estamos ocupando un middleware dentro de la app, necesitamos verificar el vencimiento de la sesion, express-session alarga por defecto el vencimiento
  //guardando en el servidor por cada peticion aunque el rollin sea en false, si solo confiamos en esto alguine nos puede copiar la cookie y mantener viva
  //la sesion creando un defecto de seguridad
  function vencida(sesion){
    const desde = config.rolling ? sesion.ultimoUso : sesion.creada;
    return Date.now() - desde > config.maxAgeMs;
  }

  // ---------- Middlewares de protección ----------

  // Paso 5 (en clase): función vencida(sesion).

  // 401: "no sé quién eres" (no hay sesión o ya venció).
  function requiereSesion(req, res, next) {
    if (!req.sesion.usuario){
      return res.status(401).json({error: '401 No has iniciado sesión o tu sesion ya vencio'});
    }
    if(vencida(req.sesion)){
      return req.session.destroy(() =>{
        res.clearCookie(NOMBRE_COOKIE);
        res.status(401).json({error: '401 Tu sesion vencio vuelve a iniciar sesión'});
      });
    }
    req.session.ultimoUso = Date.now();
    return next();
    // Paso 1 (en clase)
    return pendiente(1)(req, res, next);
  }

  // 403: "sé quién eres, pero no tienes permiso".
  function requiereRol(rol) {
    // Paso 3 (en clase)
    return (req, res, next) => {
      if(req.session.usuario.rol !== rol){
        return res.status(403).json({error: `403. Eres ${req.sesion.usuario.usuario}, pero esta ruta es solo para ${rol}`});
      }
      next();
    };
  }

  //vamos a empezar a configurar las rutas
  // ---------- Rutas ----------

  app.get('/api/config', (req, res) => res.json(config));

  //vamos a crear una ruta para un perfil visitante y obtener su sesion a partir de una cookie
  // Guarda un contador en la sesión. Sirve para ver que la sesión existe antes de entrar
  // (y para la demostración de fijación de sesión).
  app.post('/api/visita', (req, res) => {
    if (!req.session) return res.json({error: 'No tiene una sesion asociada'});
    req.session.visitas = (req.session.visitas || 0) + 1;
    res.json({ visitas: req.session.visitas, sesion: idCorto(req.sessionID) });
  });

  // Paso 2 (en clase): iniciar sesión. Paso 7 (en clase): regenerar el id al entrar.
  app.post('/api/login', async(req, res, next)=>{
    try{
      const {usuario, contrasena} = req.body || {};
      const datos = await usuarios.verificar(usuario, contrasena);
      if(!datos) return res.status(401).json({error: 'Usuario o contraseña incorrectos'});
      const visitas = req.session.visitas || 0;

      const guardar = () =>{
        req.session.usuario = datos;
        req.session.visitas = visitas;
        req.session.creada = Date.now();
        req.session.ultimoUso = Date.now();
        req.session.save((error)=>{
          if(error) return next(error);
          res.json({usuario: datos, sesionAntes : antes, sesionDespues : idCorto(req.sessionID)});

        });
      }

      if(config.regenerarAlEntrar){
        //vamos a generar la sesion
        req.session.regenerate((error) => (error ? next(error): guardar()));
      }else{
        guardar();
      }

      //debemos crear la sesion
      const antes = req.session.visitas !== undefined ? idCorto(req.sessionID) : null;
    }catch(error){
      next(error); //se genera un buncle con el cual se obliga a que se realice
    }
  });

  // Paso 2 (en clase): cerrar sesión.
  app.post('/api/logout', (req, res, next)=>{
    req.session.destroy((error)=>{
      if (error) return next(error);
      res.clearCookie(NOMBRE_COOKIE);
      res.json({mensaje : 'Sesion cerrada'});
    });
  });

  app.get('/api/sesion', requiereSesion, (req, res) => {
    const desde = config.rolling ? req.session.ultimoUso : req.session.creada;
    res.json({
      usuario: req.session.usuario,
      sesion: idCorto(req.sessionID),
      expiraEnSegundos: Math.max(0, Math.round((desde + config.maxAgeMs - Date.now()) / 1000)),
    });
  });

  app.get('/api/perfil', requiereSesion, (req, res) => {
    req.session.visitas = (req.session.visitas || 0) + 1;
    res.json({ mensaje: `Hola, ${req.session.usuario.nombre}`, rol: req.session.usuario.rol, visitas: req.session.visitas });
  });

  app.get('/api/admin/reporte', requiereSesion, requiereRol('admin'), (req, res) => {
    res.json({ reporte: 'Talleres: 3 · Inscritos: 57 · Cupo libre: 18' });
  });

  // SOLO PARA LA CLASE: muestra lo que el servidor guarda de cada sesión.
  // Un servidor real NUNCA expone esto.
  app.get('/api/diagnostico/sesiones', async (req, res, next) => {
    try {
      const sesiones = await todasLasSesiones(almacen);
      const lista = Object.entries(sesiones || {}).map(([id, s]) => ({
        sesion: idCorto(id),
        esLaTuya: id === req.sessionID,
        usuario: s.usuario ? s.usuario.usuario : '(sin iniciar sesión)',
        visitas: s.visitas || 0,
        expira: s.cookie && s.cookie.expires,
      }));
      res.json({ almacen: config.almacen, sesiones: lista });
    } catch (error) {
      next(error);
    }
  });
  //jwt

  const SECRETO_JWT = config.jwtSecreto || process.env.JWT_SECRET || 'secreto-jwt-solo-para-esta-demo';
  const JWT_EXPIRA_SEG = config.jwtExpiraSeg ?? 300;
  const JWT_REVOCAR = config.jwtRevocar ?? false;

  //tenemos que crear un token por usuario, mas los datos correspondientes mas el vencimiento de dicho token mas la firma
  function firmarToken(usuario){
    return jwt.sign(
      {
        sub : String(usuario.id), usuario: usuario.usuario, nombre: usuario.nombre, rol: usuario.rol
      }, SECRETO_JWT,
      {
        algorithm : 'HS256', expiresIn: config.jwtExpiraSeg, jwtid: crypto.randomUUID()
      }
    );
  }

  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  });


  //vamos con el middleware

  async function requireJWT(req, res, next) {
    
    const encabezado = req.headers.authorization || '';

    if (!encabezado.starWith('Bearer')){
      return res.status(401).json({error: '401. Falta el token'});
    }
    const token = encabezado.slice('Bearer', length);
    
    let datos;
    try{
      datos = jwt.verify(token, SECRETO_JWT, {algorithms:['HS256']});
    }catch(error){
      if(error.name === 'TokenExpiredError'){
        return res.status(401).json({error: '401 Token Expirado, por favor renuevelo'});
      }
      return res.status(401).json({error: '401. Token Invalido'})
    }

  

  try{
    if(JWT_REVOCAR && (await tokens.estaRevocado(datos.jti))){
      return res.status(401).json({error: '401 Token revocado y ya se cerro la sesion'});
    }
  }catch(error){
    return next(error);
  }
  req.jwt = datos;
  next();
  }


  function requiereRolJWT(rol){
    return (req, res, next) =>{
      if(req.jwt.rol !== rol){
        return res.status(403).json({error: `403 Eres ${req.jwt.usuario}, pero esta ruta le pertenece a ${rol}`});
      }
      next();
    }
  }

  //esto ya es para que lo implemente en las rutas
  app.post('/api/jwt/login', async(req, res, next) =>{
    try{
      const {usuario, contrasena} = req.body || {};
      const datos = await usuarios.verificar(usuario, contrasena);
      if(!datos) return res.status(401).json({error: 'Usuario o contraseña incorrecta'});

      res.json({token: firmarToken(datos), usuario:datos});
    }catch(error){
      next(error);
    }

    app.get('/api/jwt/perfil', requireJWT, (req, res) => {
      res.json({
        mensaje : `Hola ${req.jwt.nombre}`,
        rol: req.jwt.rol,
        expiraEnSegundos: Math.max(0, req.jwt.exp - Math.floor(Date.nom() / 1000)),
      });
    });

    app.get('/api/jwt/admin/reporte', requireJWT, requiereRolJWT('admin'), (req, res)=>{
      res.json({reporte: 'Talleres: 3'});
    });

    app.post('/api/jwt/logout', requireJWT, async(req, res, next)=>{
      try{
        if(config.jwtRevocar){
          await tokens.revocar(req.jwt.jti, req.jwt.usuario, req.jwt.exp);
          return res.json({mensaje: 'Token revocado, se agrega a la lista negra', revocado : true}); 
        }
        res.json({mensaje: 'El servidor no guarda nada', revocado: false});
      }catch(error){
        next(error);
      }
    });
  })



  return app;
}

module.exports = { crearApp, NOMBRE_COOKIE };

//primera tarea deberan de desarrollar una infografia sobre el uso de jwt para el inicio de seion para el domingo 15 de noviembre

// segunda tarea deberan de desarrollar la implementacion del codigo para realizar la autenticacion y pruebas 