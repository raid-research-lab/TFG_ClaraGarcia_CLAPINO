const { Parser } = require("node-sql-parser");

const parser = new Parser();

/**
 * Convierte una única consulta SQL en un AST.
 */
function createSqlAst(sql) {
  if (typeof sql !== "string") {
    throw new Error("La consulta SQL debe ser un texto");
  }

  const cleanSql = sql.trim();

  if (!cleanSql) {
    throw new Error("La consulta SQL está vacía");
  }

  try {
    const parsedResult = parser.astify(cleanSql, {
      database: "MySQL"
    });

    /*
     * Según la consulta y la versión de la librería,
     * astify puede devolver un objeto o un array.
     */
    const statements = Array.isArray(parsedResult)
      ? parsedResult
      : [parsedResult];

    if (statements.length !== 1) {
      throw new Error(
        "CLAPINO solo permite analizar una consulta SQL cada vez"
      );
    }

    return statements[0];
  } catch (error) {
    if (
      error.message ===
      "CLAPINO solo permite analizar una consulta SQL cada vez"
    ) {
      throw error;
    }

    throw new Error(
      `No se ha podido analizar la consulta SQL: ${error.message}`
    );
  }
}

module.exports = {
  createSqlAst
};