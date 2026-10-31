import { useEffect, useState } from 'react';
import { pedirJSON } from '../lib/api';
import { formatearFecha, ocultarBoleta } from '../lib/formato';
import { filtrarNombre, validarBoleta, validarNombre } from '../lib/validaciones';
import estilos from '../styles/Talleres.module.css';

export default function Asistencias() {
  const [talleres, setTalleres] = useState([]);
  const [tallerId, setTallerId] = useState('');
  const [asistencias, setAsistencias] = useState([]);
  const [cargandoTalleres, setCargandoTalleres] = useState(true);
  const [cargandoAsistencias, setCargandoAsistencias] = useState(false);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [boleta, setBoleta] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarTalleres() {
      try {
        const datos = await pedirJSON('/talleres');
        setTalleres(datos);
        if (datos.length > 0) setTallerId(datos[0].id);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargandoTalleres(false);
      }
    }

    cargarTalleres();
  }, []);

  useEffect(() => {
    if (!tallerId) {
      setAsistencias([]);
      return;
    }

    async function cargarAsistencias() {
      setCargandoAsistencias(true);
      setError('');
      try {
        setAsistencias(await pedirJSON(`/talleres/${tallerId}/asistencias`));
      } catch (err) {
        setError(err.message);
      } finally {
        setCargandoAsistencias(false);
      }
    }

    cargarAsistencias();
  }, [tallerId]);

  const tallerSeleccionado = talleres.find((taller) => taller.id === tallerId);
  const tallerLleno = tallerSeleccionado && asistencias.length >= tallerSeleccionado.cupo;

  async function registrarAsistencia(event) {
    event.preventDefault();
    setErrorForm('');
    setExito('');

    const nombreLimpio = nombre.trim();
    const boletaLimpia = boleta.trim();
    if (!validarNombre(nombreLimpio)) {
      return setErrorForm('El nombre solo puede contener letras y espacios.');
    }
    if (!/^[\p{L}]+(?: [\p{L}]+)*$/u.test(nombreLimpio)) {
      return setErrorForm('El nombre solo puede contener letras y espacios.');
    }
    if (!validarBoleta(boletaLimpia)) return setErrorForm('La boleta debe tener 10 dígitos.');
    if (asistencias.some((asistencia) => asistencia.boleta === boletaLimpia)) {
      return setErrorForm('Esa boleta ya está inscrita en este taller.');
    }
    if (tallerLleno) return setErrorForm('El taller ya no tiene lugares.');

    setGuardando(true);
    try {
      await pedirJSON('/asistencias', {
        method: 'POST',
        body: JSON.stringify({
          taller_id: tallerId,
          nombre_alumno: nombreLimpio,
          boleta: boletaLimpia,
        }),
      });
      const actualizadas = await pedirJSON(`/talleres/${tallerId}/asistencias`);
      setAsistencias(actualizadas);
      setNombre('');
      setBoleta('');
      setExito(`${nombreLimpio} quedó inscrito(a) en el taller.`);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main>
      <h1>Asistencias</h1>
      {cargandoTalleres && <p>Cargando talleres…</p>}
      {!cargandoTalleres && !error && talleres.length === 0 && <p>No hay talleres registrados.</p>}
      {!cargandoTalleres && talleres.length > 0 && (
        <>
          <label htmlFor="taller-asistencias">Taller</label>
          <select
            id="taller-asistencias"
            className={estilos.selector}
            value={tallerId}
            onChange={(event) => setTallerId(event.target.value)}
          >
            {talleres.map((taller) => (
              <option key={taller.id} value={taller.id}>{taller.nombre}</option>
            ))}
          </select>
          {tallerSeleccionado && (
            <p>
              {formatearFecha(tallerSeleccionado.fecha)} · {asistencias.length} inscritos de {tallerSeleccionado.cupo}
            </p>
          )}
          {error && <p className="error">{error}</p>}
          {cargandoAsistencias && <p>Cargando asistencias…</p>}
          {!cargandoAsistencias && !error && tallerSeleccionado && (
            <section className={estilos.panel}>
              <h2>Agregar asistencia</h2>
              <form onSubmit={registrarAsistencia} className="formulario">
                <input
                  aria-label="Nombre del alumno"
                  placeholder="Nombre completo"
                  autoComplete="name"
                  maxLength={80}
                  value={nombre}
                  onChange={(event) => setNombre(filtrarNombre(event.target.value))}
                />
                <input
                  aria-label="Boleta del alumno"
                  inputMode="numeric"
                  placeholder="Boleta (10 dígitos)"
                  value={boleta}
                  onChange={(event) => setBoleta(event.target.value)}
                />
                <button type="submit" disabled={Boolean(tallerLleno) || guardando}>
                  {tallerLleno ? 'Taller lleno' : guardando ? 'Guardando…' : 'Agregar asistencia'}
                </button>
              </form>
              {errorForm && <p className="error">{errorForm}</p>}
              {exito && <p className={estilos.exito}>{exito}</p>}
            </section>
          )}
          {!cargandoAsistencias && !error && asistencias.length === 0 && (
            <p>Todavía no hay inscritos en este taller.</p>
          )}
          {!cargandoAsistencias && !error && asistencias.length > 0 && (
            <div className={estilos.tablaContenedor}>
              <table>
                <thead>
                  <tr><th>#</th><th>Nombre</th><th>Boleta</th><th>Fecha de registro</th></tr>
                </thead>
                <tbody>
                  {asistencias.map((asistencia, indice) => (
                    <tr key={asistencia.id}>
                      <td>{indice + 1}</td>
                      <td>{asistencia.nombre_alumno}</td>
                      <td>{ocultarBoleta(asistencia.boleta)}</td>
                      <td>{asistencia.fecha_registro ? new Date(asistencia.fecha_registro).toLocaleString('es-MX') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {error && cargandoTalleres && <p className="error">{error}</p>}
    </main>
  );
}