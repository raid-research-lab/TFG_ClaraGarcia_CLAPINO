function construirContextoActual(contexto = {}) {
  const {
    sql = "",
    crt = "",
    ar = "",
    error = "",
    resultado = null,
    baseDatos = ""
  } = contexto;

  let resultadoTexto =
    "No hay ningún resultado de ejecución disponible.";

  if (resultado) {
    try {
      resultadoTexto = JSON.stringify(
        resultado,
        null,
        2
      );
    } catch {
      resultadoTexto =
        "Hay un resultado disponible, pero no se ha podido representar.";
    }
  }

  return `
ESTADO ACTUAL DE CLAPINO

Base de datos conectada:
${baseDatos || "No hay ninguna base de datos conectada."}

Consulta SQL actual:
${sql.trim() || "No hay ninguna consulta SQL escrita."}

Expresión CRT actual:
${crt.trim() || "No hay ninguna expresión CRT disponible."}

Expresión de Álgebra Relacional actual:
${ar.trim() || "No hay ninguna expresión de Álgebra Relacional disponible."}

Error actual:
${error || "No hay ningún error actualmente."}

Resultado de la última ejecución:
${resultadoTexto}

IMPORTANTE:

La información anterior representa lo que el estudiante está viendo
y utilizando actualmente en CLAPINO.

Cuando el estudiante utilice expresiones como:
- "esta consulta"
- "mi consulta"
- "este SQL"
- "esta expresión"
- "este CRT"
- "este AR"
- "esta traducción"
- "este error"
- "este resultado"
- "este operador"

debes interpretar que se refiere, cuando corresponda, a la información
del estado actual de CLAPINO mostrada anteriormente.

No inventes información que no esté presente en este contexto.
  `.trim();
}

module.exports = {
  construirContextoActual
};