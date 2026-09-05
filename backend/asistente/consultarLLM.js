async function realizarPeticionOpenRouter(messages) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Authorization":
          `Bearer ${process.env.OPENROUTER_API_KEY}`,

        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model:
          "nvidia/nemotron-3-ultra-550b-a55b:free",

        reasoning: {
          effort: "low",
          exclude: true
        },

        max_tokens: 1000,

        messages
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      "OpenRouter ha devuelto un error"
    );
  }

  return data;
}


async function consultarLLM(messages) {

  const maxIntentos = 3;

  for (let intento = 1; intento <= maxIntentos; intento++) {

    try {
      const data =
        await realizarPeticionOpenRouter(messages);

      const respuesta =
        data.choices?.[0]?.message?.content?.trim();

      if (respuesta) {
        return respuesta;
      }

      console.log(
        `Intento ${intento}: OpenRouter devolvió contenido vacío`
      );

    } catch (error) {

      console.error(
        `Intento ${intento} fallido:`,
        error.message
      );

      if (intento === maxIntentos) {
        throw error;
      }
    }
  }

  throw new Error(
    "No se ha podido obtener una respuesta del asistente"
  );
}


module.exports = {
  consultarLLM
};