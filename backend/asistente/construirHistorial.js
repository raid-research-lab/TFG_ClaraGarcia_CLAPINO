function construirHistorial(historial = []) {
  if (!Array.isArray(historial)) {
    return [];
  }

  const historialReciente =
    historial.slice(-10);

  return historialReciente
    .filter((mensaje) => {
      return (
        mensaje &&
        typeof mensaje.texto === "string" &&
        mensaje.texto.trim()
      );
    })
    .map((mensaje) => {
      if (mensaje.tipo === "usuario") {
        return {
          role: "user",
          content: mensaje.texto.trim()
        };
      }

      if (mensaje.tipo === "asistente") {
        return {
          role: "assistant",
          content: mensaje.texto.trim()
        };
      }

      return null;
    })
    .filter(Boolean);
}

module.exports = {
  construirHistorial
};