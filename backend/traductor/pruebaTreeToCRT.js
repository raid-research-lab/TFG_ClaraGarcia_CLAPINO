const { createSqlAst } = require("./sqlAstParser");

const {
  sqlAstToRelationalTree
} = require("./relationalTreeBuilder");

const { treeToCRT } = require("./treeToCRT");

const sql = `
    SELECT nombre
FROM ciclista
WHERE nomeq <> 'Banesto';
`;

try {
  const sqlAst = createSqlAst(sql);

  const relationalTree =
    sqlAstToRelationalTree(sqlAst);

  const crt = treeToCRT(relationalTree);

  console.log("Consulta SQL:");
  console.log(sql);

  console.log("\nÁrbol relacional:");
  console.dir(relationalTree, {
    depth: null
  });

  console.log("\nCálculo Relacional de Tuplas:");
  console.log(crt);
} catch (error) {
  console.error("Error:", error.message);
}