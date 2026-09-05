const { createSqlAst } = require("./sqlAstParser");

const sql = `
  SELECT nombre, edad
  FROM ciclista
  WHERE edad > 20 AND nomeq = 'Banesto';
`;

try {
  const ast = createSqlAst(sql);

  console.log("Consulta SQL:");
  console.log(sql);

  console.log("\nAST generado por node-sql-parser:");

  console.dir(ast, {
    depth: null
  });
} catch (error) {
  console.error("Error:", error.message);
}