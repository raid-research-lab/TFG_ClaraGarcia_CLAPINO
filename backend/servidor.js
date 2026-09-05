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

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

app.use(
  cors({
    origin: "http://localhost:5173",
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

function resolveDbConfig(dbConfig = {}) {
  let host = dbConfig.host;

  // Si estamos dentro de Docker y desde el frontend llega
  // localhost, usamos el nombre del servicio MySQL de Docker.
  if (
    process.env.DB_HOST &&
    (!host || host === "localhost" || host === "127.0.0.1")
  ) {
    host = process.env.DB_HOST;
  }

  return {
    host: host || process.env.DB_HOST || "localhost",
    port: Number(
      dbConfig.port ||
      process.env.DB_PORT ||
      3306
    ),
    user:
      dbConfig.user ||
      process.env.DB_USER ||
      "root",
    password:
      dbConfig.password ??
      process.env.DB_PASSWORD ??
      "",
    database:
      dbConfig.database ||
      process.env.DB_NAME ||
      "ciclismo"
  };
}

async function executeSQL(sql, dbConfig) {
  const config = resolveDbConfig(dbConfig);

  const connection = await mysql.createConnection(config);

  try {
    const [rows] = await connection.query(sql);

    return rows;
  } finally {
    await connection.end();
  }
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

app.post("/api/db/test", async (req, res) => {
  try {
    const config = resolveDbConfig(req.body);

    const connection = await mysql.createConnection(config);

    await connection.query("SELECT 1");

    await connection.end();

    res.json({
      ok: true,
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

app.post("/execute-sql", async (req, res) => {
  try {
    const { sql, dbConfig } = req.body;

    if (!sql || !sql.trim()) {
      return res.status(400).json({
        error: "Debes escribir una consulta SQL"
      });
    }

    if (!dbConfig) {
      return res.status(400).json({
        error: "Primero debes conectar una base de datos"
      });
    }

    const cleanSql = sql.trim();
    
    if (!/^SELECT\b/i.test(cleanSql)) {
      return res.status(400).json({
        error: "Por seguridad, CLAPINO solo permite ejecutar consultas SELECT"
      });
    }

    const mysqlResult = await executeSQL(sql, dbConfig);

    res.json({
      database: dbConfig.database,
      sql,
      resultado: mysqlResult
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      error: traducirErrorSQL(error)
    });
  }
});

app.post("/traducir-sql", (req, res) => {
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

    console.dir(sqlAst.where, {
      depth: null
    });

    /*console.dir(sqlAst.from, {
      depth: null
    });*/

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

app.post("/traducir-crt", (req, res) => {
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

app.post("/api/asistente", async (req, res) => {
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

app.listen(5000, () => {
  console.log("Servidor iniciado en http://localhost:5000");
});