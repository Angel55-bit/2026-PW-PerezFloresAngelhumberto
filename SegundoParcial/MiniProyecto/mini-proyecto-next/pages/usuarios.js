import { useEffect, useState } from 'react';
import { pedirJSON } from '../lib/api';
import { ocultarBoleta } from '../lib/formato';
import { filtrarNombre, validarBoleta, validarNombre } from '../lib/validaciones';
import estilos from '../styles/Talleres.module.css';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [correo, setCorreo] = useState('');
  const [boleta, setBoleta] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        setUsuarios(await pedirJSON('/usuarios'));
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    cargarUsuarios();
  }, []);

  async function registrarUsuario(event) {
    event.preventDefault();
    setErrorForm('');
    setExito('');

    const nombreLimpio = filtrarNombre(nombreNuevo).trim();
    const correoLimpio = correo.trim();
    const boletaLimpia = boleta.trim();
    if (!validarNombre(nombreLimpio)) {
      return setErrorForm('El nombre solo puede contener letras y espacios.');
    }
    if (!validarBoleta(boletaLimpia)) return setErrorForm('La boleta debe tener 10 dígitos.');
    if (contrasena.length < 8) return setErrorForm('La contraseña debe tener al menos 8 caracteres.');

    setGuardando(true);
    try {
      const creado = await pedirJSON('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombreLimpio,
          correo: correoLimpio,
          boleta: boletaLimpia,
          contrasena,
        }),
      });
      setUsuarios((actuales) => [...actuales, creado]);
      setNombreNuevo('');
      setCorreo('');
      setBoleta('');
      setContrasena('');
      setExito(`${creado.nombre} quedó registrado(a).`);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const consulta = busqueda.trim().toLowerCase();
  const visibles = usuarios.filter((usuario) =>
    `${usuario.nombre} ${usuario.correo} ${usuario.boleta}`.toLowerCase().includes(consulta)
  );

  return (
    <main>
      <h1>Usuarios</h1>
      <section className={estilos.panel}>
        <h2>Registrar usuario</h2>
        <form onSubmit={registrarUsuario} className="formulario">
          <input
            aria-label="Nombre del usuario"
            autoComplete="name"
            maxLength={80}
            placeholder="Nombre completo"
            value={nombreNuevo}
            onChange={(event) => setNombreNuevo(filtrarNombre(event.target.value))}
          />
          <input
            aria-label="Correo electrónico"
            autoComplete="email"
            type="email"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
          />
          <input
            aria-label="Boleta"
            inputMode="numeric"
            placeholder="Boleta (10 dígitos)"
            value={boleta}
            onChange={(event) => setBoleta(event.target.value)}
          />
          <input
            aria-label="Contraseña"
            autoComplete="new-password"
            type="password"
            minLength={8}
            placeholder="Contraseña (mínimo 8 caracteres)"
            value={contrasena}
            onChange={(event) => setContrasena(event.target.value)}
          />
          <button type="submit" disabled={guardando}>
            {guardando ? 'Registrando…' : 'Registrar usuario'}
          </button>
        </form>
        {errorForm && <p className="error">{errorForm}</p>}
        {exito && <p className={estilos.exito}>{exito}</p>}
      </section>
      <input
        className={estilos.buscador}
        type="search"
        placeholder="Buscar por nombre, correo o boleta"
        value={busqueda}
        onChange={(event) => setBusqueda(event.target.value)}
      />
      {cargando && <p>Cargando usuarios…</p>}
      {error && <p className="error">{error}</p>}
      {!cargando && !error && usuarios.length === 0 && <p>No hay usuarios registrados.</p>}
      {!cargando && !error && usuarios.length > 0 && visibles.length === 0 && (
        <p>No hay usuarios que coincidan con la búsqueda.</p>
      )}
      {!cargando && !error && visibles.length > 0 && (
        <div className={estilos.tablaContenedor}>
          <table>
            <thead>
              <tr><th>Nombre</th><th>Correo</th><th>Boleta</th><th>Rol</th></tr>
            </thead>
            <tbody>
              {visibles.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.correo}</td>
                  <td>{ocultarBoleta(usuario.boleta)}</td>
                  <td>{usuario.rol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}