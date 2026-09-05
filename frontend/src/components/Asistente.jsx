import { useState } from "react";
import "./Asistente.css";

function Asistente({
  sql,
  crt,
  ar,
  error,
  resultado,
  baseDatos
}) {

  const [abierto, setAbierto] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [escuchando, setEscuchando] = useState(false);

  const asistenteDisponible =
    baseDatos?.toLowerCase() === "ciclismo";

  const normalizarTerminosSQL = (texto) => {
    return texto
      .replace(/\bwere\b/gi, "WHERE")
  };

  const iniciarReconocimientoVoz = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "El reconocimiento de voz no está disponible en este navegador."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setEscuchando(true);
    };

    recognition.onresult = (event) => {
      const textoReconocido =
        event.results[0][0].transcript;

      const textoNormalizado =
        normalizarTerminosSQL(textoReconocido);

      setPregunta(textoNormalizado);

      enviarPregunta(
        textoNormalizado,
        true
      );
    };

    recognition.onerror = (event) => {
      console.error(
        "Error en reconocimiento de voz:",
        event.error
      );

      setEscuchando(false);
    };

    recognition.onend = () => {
      setEscuchando(false);
    };

    recognition.start();
  };

  const prepararTextoParaVoz = (texto) => {
    return texto

      // Siglas
      .replace(/\bSQL\b/gi, "ese cu ele")
      .replace(/\bCRT\b/gi, "ce erre te")
      .replace(/\bAR\b/gi, "a erre")

      // Palabras SQL que el TTS pronuncia mal
      .replace(/\bWHERE\b/gi, "güer")
      .replace(/\bJOIN\b/gi, "yoin")

      // Operadores de Álgebra Relacional
      .replace(/π/g, " proyección ")
      .replace(/σ/g, " selección ")
      .replace(/ρ/g, " renombrado ")
      .replace(/⋈/g, " combinación ")
      .replace(/×/g, " producto cartesiano ")
      .replace(/∪/g, " unión ")
      .replace(/∩/g, " intersección ")
      .replace(/−/g, " diferencia ")

      // Símbolos habituales en CRT
      .replace(/∈/g, " pertenece a ")
      .replace(/∃/g, " existe ")
      .replace(/∀/g, " para todo ")
      .replace(/∧/g, " y ")
      .replace(/∨/g, " o ")
      .replace(/¬/g, " no ")
      .replace(/\|/g, " tal que ")
      .replace(/\{/g, " ")
      .replace(/\}/g, " ")

      // Comparaciones
      .replace(/>=/g, " mayor o igual que ")
      .replace(/<=/g, " menor o igual que ")
      .replace(/!=/g, " distinto de ")
      .replace(/<>/g, " distinto de ")
      .replace(/=/g, " igual a ")
      .replace(/>/g, " mayor que ")
      .replace(/</g, " menor que ")

      // Hacer más natural la lectura de expresiones
      .replace(/\(/g, ", ")
      .replace(/\)/g, " ")

      // Eliminar espacios repetidos
      .replace(/\s+/g, " ")
      .trim();
  };

  const reproducirRespuesta = (texto) => {
    if (!("speechSynthesis" in window)) {
      console.error(
        "La síntesis de voz no está disponible en este navegador."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const textoParaVoz =
      prepararTextoParaVoz(texto);

    const mensajeVoz =
      new SpeechSynthesisUtterance(textoParaVoz);

    mensajeVoz.lang = "es-ES";
    mensajeVoz.rate = 1;
    mensajeVoz.pitch = 1;

    window.speechSynthesis.speak(mensajeVoz);
  };

  const enviarPregunta = async (
    textoPregunta = null,
    enviadaPorVoz = false
  ) => {

    const preguntaActual =
      textoPregunta !== null
        ? textoPregunta.trim()
        : pregunta.trim();

    if (!preguntaActual || cargando) {
      return;
    }

    if (!asistenteDisponible) {
      return;
    }

    setPregunta("");

    setMensajes((anteriores) => [
      ...anteriores,
      {
        tipo: "usuario",
        texto: preguntaActual
      }
    ]);

    setCargando(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/asistente",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            pregunta: preguntaActual,

            historial: mensajes,

            contexto: {
              sql: sql || "",
              crt: crt || "",
              ar: ar || "",
              error: error || "",
              resultado: resultado || null,
              baseDatos: baseDatos || ""
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se ha podido obtener una respuesta"
        );
      }

      setMensajes((anteriores) => [
        ...anteriores,
        {
          tipo: "asistente",
          texto: data.respuesta
        }
      ]);

      if (enviadaPorVoz) {
        reproducirRespuesta(data.respuesta);
      }

    } catch (err) {

      setMensajes((anteriores) => [
        ...anteriores,
        {
          tipo: "error",
          texto:
            err.message ||
            "Se ha producido un error al consultar el asistente."
        }
      ]);

    } finally {
      setCargando(false);
    }
  };

  const manejarTecla = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      enviarPregunta();
    }
  };

  return (
    <>
      <button
        className="asistente-boton-flotante"
        onClick={() => setAbierto(!abierto)}
        title="Asistente de CLAPINO"
      >
        IA
      </button>

      {abierto && (
        <div className="asistente-panel">

          <div className="asistente-header">
            <div>
              <h2>Asistente CLAPINO</h2>

              <span
                className={
                  asistenteDisponible
                    ? "asistente-disponible"
                    : "asistente-no-disponible"
                }
              >
                {asistenteDisponible
                  ? "BD: Ciclismo"
                  : "No disponible"}
              </span>
            </div>

            <div className="asistente-controles">

              <button
                className="asistente-cerrar"
                onClick={() => setAbierto(false)}
              >
                ×
              </button>

            </div>
          </div>

          {!asistenteDisponible ? (

            <div className="asistente-aviso">
              <p>
                El asistente está disponible
                únicamente cuando estás conectado
                a la base de datos de ciclismo.
              </p>
            </div>

          ) : (

            <>
              <div className="asistente-contexto">
                Contexto actual de CLAPINO
              </div>

              <div className="asistente-mensajes">

                {mensajes.length === 0 && (
                  <div className="asistente-bienvenida">
                    <p>
                      Puedes preguntarme sobre la
                      consulta o traducción con la
                      que estás trabajando.
                    </p>
                  </div>
                )}

                {mensajes.map((mensaje, index) => (
                  <div
                    key={index}
                    className={
                      `asistente-mensaje ${mensaje.tipo}`
                    }
                  >
                    <strong>
                      {mensaje.tipo === "usuario"
                        ? "Tú"
                        : mensaje.tipo === "error"
                          ? "Error"
                          : "Asistente"}
                    </strong>

                    <p>{mensaje.texto}</p>
                  </div>
                ))}

                {cargando && (
                  <div className="asistente-mensaje asistente">
                    <strong>Asistente</strong>
                    <p>Pensando...</p>
                  </div>
                )}

              </div>

              <div className="asistente-entrada">

                <textarea
                  value={pregunta}
                  onChange={(e) =>
                    setPregunta(e.target.value)
                  }
                  onKeyDown={manejarTecla}
                  placeholder="Pregunta sobre tu consulta..."
                  disabled={cargando}
                />

                <button
                  type="button"
                  onClick={iniciarReconocimientoVoz}
                  disabled={cargando || escuchando}
                  className="asistente-microfono"
                  title="Hablar"
                >
                  {escuchando ? "🔴" : "🎤"}
                </button>

                <button
                  onClick={() => enviarPregunta()}
                  disabled={
                    cargando ||
                    !pregunta.trim()
                  }
                >
                  Enviar
                </button>

              </div>
            </>
          )}

        </div>
      )}
    </>
  );
}

export default Asistente;