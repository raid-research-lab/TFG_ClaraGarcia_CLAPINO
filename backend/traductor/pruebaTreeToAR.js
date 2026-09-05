const { createSqlAst } = require("./sqlAstParser");

const {
  sqlAstToRelationalTree
} = require("./relationalTreeBuilder");

const { treeToAR } = require("./treeToAR");

const sql = `
  SELECT nombre
  FROM ciclista
  WHERE edad > 20
    AND (
      nomeq = 'Banesto'
      OR (
        nomeq = 'Kelme'
        AND dorsal > 10
      )
    );
`;

try {
  /*
   * Paso 1:
   * SQL → AST de la librería.
   */
  const sqlAst = createSqlAst(sql);

  /*
   * Paso 2:
   * AST SQL → árbol relacional de CLAPINO.
   */
  const relationalTree =
    sqlAstToRelationalTree(sqlAst);

  /*
   * Paso 3:
   * Árbol relacional → Álgebra Relacional.
   */
  const relationalAlgebra =
    treeToAR(relationalTree);

  console.log("Consulta SQL:");
  console.log(sql);

  console.log("\nÁrbol relacional:");
  console.dir(relationalTree, {
    depth: null
  });

  console.log("\nÁlgebra Relacional:");
  console.log(relationalAlgebra);
} catch (error) {
  console.error("Error:", error.message);
}