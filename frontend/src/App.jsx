import { useEffect, useState } from "react";
import "./App.css";
import SymbolBar from "./components/SymbolBar";
import Inicio from "./components/Inicio";
import Asistente from "./components/Asistente";

function App() {

  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  const [menuUsuarioAbierto, setMenuUsuarioAbierto] =
  useState(false);

  const [sqlQuery, setSqlQuery] = useState("");
  const [crtQuery, setCrtQuery] = useState("");
  const [arQuery, setArQuery] = useState("");

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [dbConfig, setDbConfig] = useState({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "",
    database: ""
  });

  const [connectedDb, setConnectedDb] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const comprobarSesion = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/auth/me",
          {
            credentials: "include"
          }
        );

        if (!response.ok) {
          setUsuario(null);
          return;
        }

        const data = await response.json();

        setUsuario(data.usuario);

      } catch (error) {
        console.error(
          "Error comprobando la sesión:",
          error
        );

        setUsuario(null);

      } finally {
        setCargandoSesion(false);
      }
    };

    comprobarSesion();
  }, []);

  const crtSymbols = [
    { symbol: "∧", label: "AND lógico" },
    { symbol: "∨", label: "OR lógico" },
    { symbol: "|", label: "Tal que" },
    { symbol: "¬", label: "NOT lógico" }
  ];

  const arSymbols = [
    { symbol: "π", label: "Proyección" },
    { symbol: "σ", label: "Selección" },
    { symbol: "∪", label: "Unión" },
    { symbol: "∩", label: "Intersección" },
    { symbol: "∧", label: "AND lógico" },
    { symbol: "∨", label: "OR lógico" },
    { symbol: "×", label: "Producto cartesiano" },
    { symbol: "¬", label: "NOT lógico" },
    { symbol: "γ", label: "Agrupación"}
  ];

  const addToCRT = (symbol) => {
    setCrtQuery(crtQuery + symbol + " ");
  };

  /*const addToAR = (symbol) => {
    setArQuery(arQuery + symbol + " ");
  };*/
  

  const clearAll = () => {
    setArQuery("");
    setCrtQuery("");
    setSqlQuery("");
    setResult(null);
    setError(null);
  };

  const handleConnectDB = async () => {
    try {
      setError(null);

      const response = await fetch("http://localhost:5000/api/db/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dbConfig)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setConnectedDb(dbConfig);
      setShowModal(false);
    } catch (err) {
      setConnectedDb(null);
      setError(err.message);
    }
  };

  const executeSQL = async () => {
    try {
      setError(null);
      setResult(null);

      if (!connectedDb) {
        throw new Error("Primero debes conectar una base de datos");
      }

      if (!sqlQuery.trim()) {
        throw new Error("Debes escribir una consulta SQL");
      }

      const response = await fetch(
        "http://localhost:5000/execute-sql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sql: sqlQuery,
            dbConfig: connectedDb
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  const translateSQLToCRT = async () => {
    try {
      setError(null);

      if (!sqlQuery.trim()) {
        throw new Error("Debes escribir una consulta SQL");
      }

      const response = await fetch(
        "http://localhost:5000/traducir-sql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sql: sqlQuery,
            outputType: "crt"
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setCrtQuery(data.crt);
    } catch (err) {
      setCrtQuery("");
      setError(err.message);
    }
  };

  const translateSQLToAR = async () => {
    try {
      setError(null);

      if (!sqlQuery.trim()) {
        throw new Error("Debes escribir una consulta SQL");
      }

      const response = await fetch(
        "http://localhost:5000/traducir-sql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sql: sqlQuery,
            outputType: "ar"
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setArQuery(data.ar);
    } catch (err) {
      setArQuery("");
      setError(err.message);
    }
  };

  const translateCRTToAR = async () => {
    try {
      setError(null);

      if (!crtQuery.trim()) {
        throw new Error(
          "Debes escribir una consulta CRT"
        );
      }

      const response = await fetch(
        "http://localhost:5000/traducir-crt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            crt: crtQuery
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      /*
      * Solo modificamos el panel AR.
      * El contenido escrito en CRT se mantiene.
      */
      setArQuery(data.ar);
    } catch (error) {
      setArQuery("");
      setError(error.message);
    }
  };

  if (cargandoSesion) {
    return (
      <div className="inicio">
        <div className="inicio-contenido">
          <h1>CLAPINO</h1>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <Inicio
        onEntrar={(usuarioGoogle) => {
          setUsuario(usuarioGoogle);
        }}
      />
    );
  }

  const cerrarSesion = async () => {
    try {

      const response = await fetch(
        "http://localhost:5000/auth/logout",
        {
          method: "POST",
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error(
          "No se ha podido cerrar la sesión"
        );
      }

      setUsuario(null);
      setMenuUsuarioAbierto(false);

    } catch (error) {

      console.error(
        "Error cerrando sesión:",
        error
      );

    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>CLAPINO</h1>
          <p>Traductor SQL / CRT / AR</p>
        </div>

        <div className="topbar-right">
          {connectedDb ? (
            <span className="connected">
              Conectado a: {connectedDb.database}
            </span>
          ) : (
            <span className="not-connected">Sin conexión</span>
          )}

          <button
            className="connect-button"
            onClick={() => setShowModal(true)}
          >
            Conectar BD
          </button>

          <div className="user-menu">
            <button
              className="user-button"
              onClick={() =>
                setMenuUsuarioAbierto(!menuUsuarioAbierto)
              }
            >
              <img
                src={usuario.foto}
                alt="Usuario"
                className="user-avatar"
              />
            </button>

            {menuUsuarioAbierto && (
              <div className="user-dropdown">

                <div className="user-info">
                  <strong>{usuario.nombre}</strong>
                  <span>{usuario.email}</span>
                </div>

                <button onClick={cerrarSesion}>
                  Cerrar sesión
                </button>

              </div>
            )}
          </div>
        </div>
      </header>

      <div className="translation-grid">
        
        {/* SQL */}
        <div className="panel">
          <div className="panel-title">
            <h2>SQL</h2>

            <button
              className="trash-button"
              onClick={() => setSqlQuery("")}
            >
              ⌫
            </button>
          </div>
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Escribe aquí una consulta SQL"
          />
          {/* MODIFICAR ESTOS BOTONES */}
          <div className="panel-buttons">
            <button onClick={executeSQL}>Ejecutar SQL</button>
            <button onClick={translateSQLToCRT}>Traducir a CRT</button>
            <button onClick={translateSQLToAR}>Traducir a AR</button>
          </div>
        </div>
        
        {/* CRT */}
        <div className="panel">
          <div className="panel-title">
            <h2>CRT</h2>

            <button
              className="trash-button"
              onClick={() => setCrtQuery("")}
            >
              ⌫
            </button>
          </div>

          <textarea
            value={crtQuery}
            onChange={(e) => setCrtQuery(e.target.value)}
          />

          <SymbolBar
            title="Símbolos CRT"
            symbols={crtSymbols}
            addSymbol={addToCRT}
          />

          <div className="panel-buttons">
            <button onClick={translateCRTToAR}>Traducir a AR</button>
          </div>
        </div>

        {/* AR */}
        <div className="panel">
          <div className="panel-title">
            <h2>Álgebra Relacional</h2>

            <button
              className="trash-button"
              onClick={() => setArQuery("")}
            >
              ⌫
            </button>
          </div>

          <textarea
            value={arQuery}
            readOnly
          />

          <SymbolBar
            title="Símbolos AR"
            symbols={arSymbols}
            /*addSymbol={addToAR}*/
          />

        </div>
      </div>

      {/* RESULTADOS */}
      <div className="results-card">
        <div className="results-header">
          <h2>Resultado</h2>
          <button onClick={clearAll}>Limpiar</button>
        </div>

        {error && <p className="error-text">{error}</p>}

        {result && result.resultado && (
          <div>
            {result.resultado.length > 0 ? (
              <table className="resultado-table">
                <thead>
                  <tr>
                    {Object.keys(result.resultado[0]).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {result.resultado.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i}>{String(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay resultados</p>
            )}
          </div>
        )}
      </div>
      
      {/* VENTANA PARA CONECTAR LA BD */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Conectar Base de Datos</h2>

            <input
              type="text"
              placeholder="Host"
              value={dbConfig.host}
              onChange={(e) =>
                setDbConfig({ 
                  ...dbConfig, 
                  host: e.target.value 
                })
              }
            />

            <input
              type="text"
              placeholder="Puerto"
              value={dbConfig.port}
              onChange={(e) =>
                setDbConfig({ 
                  ...dbConfig, 
                  port: e.target.value 
                })
              }
            />

            <input
              type="text"
              placeholder="Usuario"
              value={dbConfig.user}
              onChange={(e) =>
                setDbConfig({ 
                  ...dbConfig, 
                  user: e.target.value 
                })
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={dbConfig.password}
              onChange={(e) =>
                setDbConfig({ 
                  ...dbConfig, 
                  password: e.target.value 
                })
              }
            />

            <input
              type="text"
              placeholder="Base de datos"
              value={dbConfig.database}
              onChange={(e) =>
                setDbConfig({ 
                  ...dbConfig, 
                  database: e.target.value 
                })
              }
            />

            <div className="modal-buttons">
              <button onClick={handleConnectDB}>
                Conectar
              </button>
              <button onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Asistente
        sql={sqlQuery}
        crt={crtQuery}
        ar={arQuery}
        error={error}
        resultado={result?.resultado || null}
        baseDatos={connectedDb?.database || ""}
      />
    </div>
  );
}

export default App;