require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const session = require("express-session");
const { OAuth2Client } = require("google-auth-library");


const { createSqlAst } = require("./traductor/sqlAstParser");

const {
  sqlAstToRelationalTree
} = require("./traductor/relationalTreeBuilder");

const {
  crtToRelationalTree
} = require("./traductor/crtParser");

const { treeToAR } = require("./traductor/treeToAR");
const { treeToCRT } = require("./traductor/treeToCRT");

const {
  CONTEXTO_ASISTENTE
} = require("./asistente/contextoAsistente");

const {
  construirContextoActual
} = require("./asistente/construirContexto");

const {
  construirHistorial
} = require("./asistente/construirHistorial");

const {
  consultarLLM
} = require("./asistente/consultarLLM");

const app = express();

/*
 * En producción CLAPINO se sirve detrás de un proxy inverso (nginx),
 * por lo que Express debe fiarse de las cabeceras X-Forwarded-*.
 */
app.set("trust proxy", 1);

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

/*
 * Orígenes permitidos.
 *
 * En producción el frontend y el backend comparten dominio
 * (mismo nginx), por lo que CORS casi no interviene, pero se deja
 * configurado para el desarrollo local y para posibles pruebas.
 */
const origenesPermitidos = [
  process.env.PUBLIC_ORIGIN,
  "http://localhost:5173"
].filter(Boolean);

app.use(
  cors({
    origin: origenesPermitidos,
    credentials: true
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

function traducirErrorSQL(error) {
  const mensaje = error.message || "";

  if (mensaje.includes("You have an error in your SQL syntax")) {
    return "La consulta SQL contiene un error de sintaxis. Revisa la estructura de la consulta.";
  }

  if (mensaje.includes("Access denied")) {
    return "No se ha podido acceder a la base de datos. Revisa el usuario o la contraseña.";
  }

  if (mensaje.includes("Unknown database")) {
    return "La base de datos indicada no existe.";
  }

  if (mensaje.includes("ECONNREFUSED")) {
    return "No se ha podido conectar con el servidor MySQL. Revisa el host y el puerto.";
  }

  if (mensaje.includes("Unknown column")) {
    return "La consulta utiliza una columna que no existe en la base de datos.";
  }

  if (mensaje.includes("doesn't exist")) {
    return "La consulta utiliza una tabla que no existe en la base de datos.";
  }

  return "Se ha producido un error al ejecutar la consulta.";
}

/*
 * Bases de datos que el usuario puede utilizar.
 *
 * Se definen en el servidor (variable ALLOWED_DATABASES). El cliente
 * únicamente puede elegir un nombre de esta lista: nunca envía host,
 * usuario ni contraseña.
 */
const BASES_PERMITIDAS = (
  process.env.ALLOWED_DATABASES ||
  process.env.DB_NAME ||
  "ciclismo"
)
  .split(",")
  .map((nombre) => nombre.trim())
  .filter(Boolean);

const BASE_POR_DEFECTO = BASES_PERMITIDAS[0];

/*
 * Comprueba que el nombre de base de datos recibido está permitido
 * y devuelve el nombre tal y como está escrito en la configuración
 * del servidor.
 */
function resolveDatabaseName(nombreSolicitado) {
  if (
    nombreSolicitado === undefined ||
    nombreSolicitado === null ||
    nombreSolicitado === ""
  ) {
    return BASE_POR_DEFECTO;
  }

  if (typeof nombreSolicitado !== "string") {
    throw new Error("El nombre de la base de datos no es válido");
  }

  const nombreNormalizado = nombreSolicitado.trim().toLowerCase();

  const encontrada = BASES_PERMITIDAS.find((nombre) => {
    return nombre.toLowerCase() === nombreNormalizado;
  });

  if (!encontrada) {
    throw new Error(
      "La base de datos seleccionada no está disponible en CLAPINO"
    );
  }

  return encontrada;
}

/*
 * Construye la configuración de conexión.
 *
 * Host, puerto, usuario y contraseña salen SIEMPRE del entorno del
 * servidor. Del cliente solo se acepta el nombre de la base de datos,
 * y solo si está en la lista de permitidas.
 */
function resolveDbConfig(nombreBaseDatos) {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: resolveDatabaseName(nombreBaseDatos),

    // Impide encadenar varias sentencias en una sola petición
    multipleStatements: false
  };
}

/*
 * Solo se permiten consultas de lectura: una única sentencia SELECT.
 */
function validarConsultaDeLectura(sql) {
  const consulta = sql.trim().replace(/;\s*$/, "");

  if (!consulta) {
    throw new Error("Debes escribir una consulta SQL");
  }

  if (consulta.includes(";")) {
    throw new Error(
      "Solo se puede ejecutar una consulta cada vez"
    );
  }

  if (!/^SELECT\b/i.test(consulta)) {
    throw new Error(
      "Por seguridad, CLAPINO solo permite ejecutar consultas SELECT"
    );
  }

  return consulta;
}

async function executeSQL(sql, nombreBaseDatos) {
  const config = resolveDbConfig(nombreBaseDatos);

  const connection = await mysql.createConnection(config);

  try {
    const [rows] = await connection.query(sql);

    return rows;
  } finally {
    await connection.end();
  }
}

/*
 * Middleware: exige sesión iniciada.
 *
 * Protege la base de datos, el traductor y el asistente (que consume
 * una clave de API de pago) frente a peticiones anónimas.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({
      ok: false,
      error: "Debes iniciar sesión para usar CLAPINO"
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.send("Backend de CLAPINO funcionando");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "El frontend está conectado con el backend"
  });
});

/*
 * Lista de bases de datos disponibles.
 */
app.get("/api/db", requireAuth, (req, res) => {
  res.json({
    ok: true,
    bases: BASES_PERMITIDAS,
    porDefecto: BASE_POR_DEFECTO
  });
});

/*
 * Comprueba la conexión con una de las bases de datos permitidas.
 */
app.post("/api/db/test", requireAuth, async (req, res) => {
  try {
    const config = resolveDbConfig(req.body?.database);

    const connection = await mysql.createConnection(config);

    await connection.query("SELECT 1");

    await connection.end();

    res.json({
      ok: true,
      database: config.database,
      message: "Conexión correcta con MySQL"
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      ok: false,
      error: traducirErrorSQL(error)
    });
  }
});

app.post("/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: "No se ha recibido la credencial de Google"
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const usuario = {
      id: payload.sub,
      nombre: payload.name,
      email: payload.email,
      foto: payload.picture
    };

    // Guardamos el usuario en la sesión
    req.session.usuario = usuario;

    res.json({
      ok: true,
      usuario
    });

  } catch (error) {
    console.error("Error verificando Google:", error);

    res.status(401).json({
      error: "Credencial de Google no válida"
    });
  }
});

app.get("/auth/me", (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({
      autenticado: false
    });
  }

  res.json({
    autenticado: true,
    usuario: req.session.usuario
  });
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        error: "No se ha podido cerrar la sesión"
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      ok: true
    });
  });
});

app.post("/execute-sql", requireAuth, async (req, res) => {
  try {
    const { sql, database } = req.body;

    if (typeof sql !== "string") {
      return res.status(400).json({
        error: "Debes escribir una consulta SQL"
      });
    }

    // Lanza un error descriptivo si no es una única sentencia SELECT
    const consulta = validarConsultaDeLectura(sql);

    // Valida el nombre contra la lista de bases permitidas
    const nombreBaseDatos = resolveDatabaseName(database);

    const mysqlResult = await executeSQL(
      consulta,
      nombreBaseDatos
    );

    res.json({
      database: nombreBaseDatos,
      sql: consulta,
      resultado: mysqlResult
    });
  } catch (error) {
    console.error(error);

    /*
     * Los errores de validación de CLAPINO ya llevan un mensaje
     * pensado para el estudiante; los de MySQL se traducen.
     */
    const esErrorDeMysql = Boolean(error.sqlMessage || error.code);

    res.status(400).json({
      error: esErrorDeMysql
        ? traducirErrorSQL(error)
        : error.message
    });
  }
});

app.post("/traducir-sql", requireAuth, (req, res) => {
  try {
    const { sql, outputType } = req.body;

    if (typeof sql !== "string" || !sql.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Debes enviar una consulta SQL"
      });
    }

    if (
      outputType !== "crt" &&
      outputType !== "ar"
    ) {
      return res.status(400).json({
        ok: false,
        error: "Debes indicar si quieres obtener CRT o AR"
      });
    }

    const sqlAst = createSqlAst(sql);

    const relationalTree =
      sqlAstToRelationalTree(sqlAst);

    if (outputType === "crt") {
      const crt = treeToCRT(relationalTree);

      return res.json({
        ok: true,
        sql: sql.trim(),
        crt
      });
    }

    const ar = treeToAR(relationalTree);

    return res.json({
      ok: true,
      sql: sql.trim(),
      ar
    });
  } catch (error) {
    console.error("Error al traducir SQL:", error);

    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

app.post("/traducir-crt", requireAuth, (req, res) => {
  try {
    const { crt } = req.body;

    if (
      typeof crt !== "string" ||
      !crt.trim()
    ) {
      return res.status(400).json({
        ok: false,
        error: "Debes enviar una consulta CRT"
      });
    }

    /*
     * Paso 1:
     * CRT → árbol relacional de CLAPINO.
     */
    const relationalTree =
      crtToRelationalTree(crt);

    /*
     * Paso 2:
     * Árbol relacional → AR.
     */
    const ar = treeToAR(relationalTree);

    return res.json({
      ok: true,
      crt: crt.trim(),
      relationalTree,
      ar
    });
  } catch (error) {
    console.error(
      "Error al traducir CRT:",
      error
    );

    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

app.post("/api/asistente", requireAuth, async (req, res) => {
  try {
    const {
      pregunta,
      contexto = {},
      historial = []
    } = req.body;

    if (
      typeof pregunta !== "string" ||
      !pregunta.trim()
    ) {
      return res.status(400).json({
        ok: false,
        error: "Debes enviar una pregunta"
      });
    }

    const contextoActual =
      construirContextoActual(contexto); 

    const historialConversacion =
      construirHistorial(historial);

    const mensajesLLM = [
      {
        role: "system",
        content: CONTEXTO_ASISTENTE
      },
      {
        role: "system",
        content: contextoActual
      },

      ...historialConversacion,

      {
        role: "user",
        content: pregunta.trim()
      }
    ];

    const respuesta =
      await consultarLLM(mensajesLLM);

    return res.json({
      ok: true,
      respuesta
    });

  } catch (error) {
    console.error(
      "Error en el asistente:",
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        "No se ha podido obtener una respuesta del asistente"
    });
  }
});

const PUERTO = Number(process.env.PORT || 5000);

app.listen(PUERTO, "0.0.0.0", () => {
  console.log(`Servidor iniciado en el puerto ${PUERTO}`);
});