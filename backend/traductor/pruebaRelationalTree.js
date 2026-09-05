const { createSqlAst } = require("./sqlAstParser");
const {
  sqlAstToRelationalTree
} = require("./relationalTreeBuilder");

const sql = `
  SELECT nombre
  FROM ciclista
  WHERE edad < 20 OR edad > 30;
`;

try {
  /*
   * Primer árbol:
   * SQL → AST de node-sql-parser.
   */
  const sqlAst = createSqlAst(sql);

  /*
   * Segundo árbol:
   * AST SQL → árbol relacional de CLAPINO.
   */
  const relationalTree =
    sqlAstToRelationalTree(sqlAst);

  console.log("Consulta SQL:");
  console.log(sql);

  console.log("\nAST de node-sql-parser:");
  console.dir(sqlAst, {
    depth: null
  });

  console.log("\nÁrbol relacional de CLAPINO:");
  console.dir(relationalTree, {
    depth: null
  });
} catch (error) {
  console.error("Error:", error.message);
}