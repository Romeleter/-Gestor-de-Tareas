import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const estados = ["pendiente", "en progreso", "completada"];
const prioridades = ["baja", "media", "alta"];
const nombresEstado = {
  pendiente: "Pendiente",
  "en progreso": "En Progreso",
  completada: "Completada",
};

function leerDatos(clave, valorInicial) {
  const datosGuardados = localStorage.getItem(clave);
  if (!datosGuardados) return valorInicial;

  try {
    return JSON.parse(datosGuardados);
  } catch (error) {
    return valorInicial;
  }
}

function App() {
  const [usuarios, setUsuarios] = useState(() => leerDatos("usuarios", []));
  const [usuarioActivo, setUsuarioActivo] = useState(() =>
    leerDatos("usuarioActivo", null)
  );
  const [tareas, setTareas] = useState(() => leerDatos("tareas", []));
  const [pantallaLogin, setPantallaLogin] = useState("login");

  const [formUsuario, setFormUsuario] = useState({
    nombre: "",
    correo: "",
    password: "",
  });

  const [formTarea, setFormTarea] = useState({
    titulo: "",
    descripcion: "",
    fecha: "",
    prioridad: "baja",
    estado: "pendiente",
  });

  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todas");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    localStorage.setItem("usuarioActivo", JSON.stringify(usuarioActivo));
  }, [usuarioActivo]);

  useEffect(() => {
    localStorage.setItem("tareas", JSON.stringify(tareas));
  }, [tareas]);

  const tareasDelUsuario = useMemo(() => {
    if (!usuarioActivo) return [];

    return tareas
      .filter((tarea) => tarea.usuarioId === usuarioActivo.id)
      .filter((tarea) => {
        const texto = `${tarea.titulo} ${tarea.descripcion}`.toLowerCase();
        const coincideBusqueda = texto.includes(busqueda.toLowerCase());
        const coincideEstado =
          filtroEstado === "todos" || tarea.estado === filtroEstado;
        const coincidePrioridad =
          filtroPrioridad === "todas" || tarea.prioridad === filtroPrioridad;

        return coincideBusqueda && coincideEstado && coincidePrioridad;
      });
  }, [tareas, usuarioActivo, busqueda, filtroEstado, filtroPrioridad]);

  function cambiarUsuario(evento) {
    const { name, value } = evento.target;
    setFormUsuario({ ...formUsuario, [name]: value });
  }

  function cambiarTarea(evento) {
    const { name, value } = evento.target;
    setFormTarea({ ...formTarea, [name]: value });
  }

  function registrar(evento) {
    evento.preventDefault();

    if (!formUsuario.nombre || !formUsuario.correo || !formUsuario.password) {
      setMensaje("Debe llenar todos los datos para registrarse.");
      return;
    }

    const yaExiste = usuarios.some(
      (usuario) => usuario.correo === formUsuario.correo
    );

    if (yaExiste) {
      setMensaje("Ya existe una cuenta con ese correo.");
      return;
    }

    const nuevoUsuario = {
      id: Date.now(),
      nombre: formUsuario.nombre,
      correo: formUsuario.correo,
      password: formUsuario.password,
    };

    setUsuarios([...usuarios, nuevoUsuario]);
    setUsuarioActivo(nuevoUsuario);
    setFormUsuario({ nombre: "", correo: "", password: "" });
    setMensaje("");
  }

  function iniciarSesion(evento) {
    evento.preventDefault();

    const usuarioEncontrado = usuarios.find(
      (usuario) =>
        usuario.correo === formUsuario.correo &&
        usuario.password === formUsuario.password
    );

    if (!usuarioEncontrado) {
      setMensaje("Correo o contraseña incorrectos.");
      return;
    }

    setUsuarioActivo(usuarioEncontrado);
    setFormUsuario({ nombre: "", correo: "", password: "" });
    setMensaje("");
  }

  function guardarTarea(evento) {
    evento.preventDefault();

    if (!formTarea.titulo || !formTarea.descripcion || !formTarea.fecha) {
      setMensaje("Complete los campos de la tarea.");
      return;
    }

    if (idEditando) {
      const tareasActualizadas = tareas.map((tarea) =>
        tarea.id === idEditando ? { ...tarea, ...formTarea } : tarea
      );

      setTareas(tareasActualizadas);
      setIdEditando(null);
    } else {
      const nuevaTarea = {
        id: Date.now(),
        usuarioId: usuarioActivo.id,
        ...formTarea,
      };

      setTareas([...tareas, nuevaTarea]);
    }

    setFormTarea({
      titulo: "",
      descripcion: "",
      fecha: "",
      prioridad: "baja",
      estado: "pendiente",
    });
    setMensaje("");
  }

  function editarTarea(tarea) {
    setFormTarea({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      fecha: tarea.fecha,
      prioridad: tarea.prioridad,
      estado: tarea.estado,
    });
    setIdEditando(tarea.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function eliminarTarea(id) {
    const confirmar = confirm("¿Seguro que desea eliminar esta tarea?");
    if (confirmar) {
      setTareas(tareas.filter((tarea) => tarea.id !== id));
    }
  }

  function completarTarea(id) {
    setTareas(
      tareas.map((tarea) =>
        tarea.id === id ? { ...tarea, estado: "completada" } : tarea
      )
    );
  }

  function cerrarSesion() {
    setUsuarioActivo(null);
    setMensaje("");
    setIdEditando(null);
  }

  if (!usuarioActivo) {
    return (
      <main className="login-page">
        <section className="login-box">
          <h1>Gestor de tareas</h1>
          <p className="intro">
            Aplicación web para registrar usuarios y organizar tareas diarias.
          </p>

          <div className="tabs">
            <button
              className={pantallaLogin === "login" ? "activo" : ""}
              onClick={() => {
                setPantallaLogin("login");
                setMensaje("");
              }}
            >
              Iniciar sesión
            </button>
            <button
              className={pantallaLogin === "registro" ? "activo" : ""}
              onClick={() => {
                setPantallaLogin("registro");
                setMensaje("");
              }}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={pantallaLogin === "login" ? iniciarSesion : registrar}>
            {pantallaLogin === "registro" && (
              <label>
                Nombre
                <input
                  name="nombre"
                  value={formUsuario.nombre}
                  onChange={cambiarUsuario}
                  placeholder="Ej: Laura Perez"
                />
              </label>
            )}

            <label>
              Correo
              <input
                type="email"
                name="correo"
                value={formUsuario.correo}
                onChange={cambiarUsuario}
                placeholder="correo@ejemplo.com"
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                name="password"
                value={formUsuario.password}
                onChange={cambiarUsuario}
                placeholder="1234"
              />
            </label>

            {mensaje && <p className="mensaje">{mensaje}</p>}

            <button className="principal" type="submit">
              {pantallaLogin === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header>
        <div>
          <h1>
          Mis tareas
          <img src="/tareas.png" alt="tareas" style={{width: "32px", verticalAlign: "middle", marginRight: "8px"}} />
          </h1>
          <p>Hola, {usuarioActivo.nombre}. Organiza tus actividades del día.</p>
        </div>
        <button className="secundario" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      <section className="panel">
        <h2>{idEditando ? "Editar tarea" : "Nueva tarea"}</h2>

        <form className="form-tarea" onSubmit={guardarTarea}>
          <label className="campo-titulo">
            Título
            <input
              name="titulo"
              value={formTarea.titulo}
              onChange={cambiarTarea}
              placeholder="Ej: Estudiar React"
            />
          </label>

          <label className="campo-fecha">
            Fecha de vencimiento
            <input
              type="date"
              name="fecha"
              value={formTarea.fecha}
              onChange={cambiarTarea}
            />
          </label>

          <label className="campo-select">
            Prioridad
            <select
              name="prioridad"
              value={formTarea.prioridad}
              onChange={cambiarTarea}
            >
              {prioridades.map((prioridad) => (
                <option key={prioridad} value={prioridad}>
                  {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="campo-select">
            Estado
            <select
              name="estado"
              value={formTarea.estado}
              onChange={cambiarTarea}
            >
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {nombresEstado[estado]}
                </option>
              ))}
            </select>
          </label>

          <label className="descripcion">
            Descripción
            <textarea
              name="descripcion"
              value={formTarea.descripcion}
              onChange={cambiarTarea}
              placeholder="Escriba una breve descripción"
            />
          </label>

          {mensaje && <p className="mensaje">{mensaje}</p>}

          <div className="acciones-form">
            <button className="principal" type="submit">
              {idEditando ? "Guardar cambios" : "Crear tarea"}
            </button>
            {idEditando && (
              <button
                className="secundario"
                type="button"
                onClick={() => {
                  setIdEditando(null);
                  setFormTarea({
                    titulo: "",
                    descripcion: "",
                    fecha: "",
                    prioridad: "baja",
                    estado: "pendiente",
                  });
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="barra-filtros">
        <div className="filtros">
          <div className="buscador">
            <span aria-hidden="true">⌕</span>
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por título o descripción"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(evento) => setFiltroEstado(evento.target.value)}
          >
            <option value="todos">Todos los estados</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {nombresEstado[estado]}
              </option>
            ))}
          </select>

          <select
            value={filtroPrioridad}
            onChange={(evento) => setFiltroPrioridad(evento.target.value)}
          >
            <option value="todas">Todas las prioridades</option>
            {prioridades.map((prioridad) => (
              <option key={prioridad} value={prioridad}>
                {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="columnas">
        {estados.map((estado) => {
          const tareasPorEstado = tareasDelUsuario.filter(
            (tarea) => tarea.estado === estado
          );

          return (
            <div className="columna" key={estado}>
              <div className="columna-header">
                <h2>
                  <span className="punto" />
                  {nombresEstado[estado]}
                </h2>
                <span className="contador">{tareasPorEstado.length}</span>
              </div>
              {tareasPorEstado.length === 0 && (
                <div className="vacio">
                  <span aria-hidden="true">▭</span>
                  <p>No hay tareas en esta sección</p>
                </div>
              )}

              {tareasPorEstado.map((tarea) => (
                <article className={`tarea prioridad-${tarea.prioridad}`} key={tarea.id}>
                  <div className="tarea-top">
                    <span>{tarea.prioridad}</span>
                    <div className="botones-tarea">
                      {tarea.estado !== "completada" && (
                        <button onClick={() => completarTarea(tarea.id)} title="Completar">
                          ✓
                        </button>
                      )}
                      <button onClick={() => editarTarea(tarea)} title="Editar">
                        ✎
                      </button>
                      <button onClick={() => eliminarTarea(tarea.id)} title="Eliminar">
                        🗑
                      </button>
                    </div>
                  </div>
                  <h3>{tarea.titulo}</h3>
                  <p>{tarea.descripcion}</p>
                  <small>▣ {tarea.fecha}</small>
                </article>
              ))}
            </div>
          );
        })}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
