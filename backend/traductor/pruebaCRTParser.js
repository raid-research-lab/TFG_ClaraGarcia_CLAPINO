const {
  crtToRelationalTree
} = require("./crtParser");

const { treeToAR } = require("./treeToAR");

const crt = `
  {
    t.nombre
    |
    ciclista(t)
    ∧ (
      t.edad > 20
      ∧ (
        t.nomeq = 'Banesto'
        ∨ t.nomeq = 'Kelme'
      )
    )
  }
`;

try {
  const relationalTree =
    crtToRelationalTree(crt);

  const ar = treeToAR(relationalTree);

  console.log("Consulta CRT:");
  console.log(crt);

  console.log("\nÁrbol relacional:");
  console.dir(relationalTree, {
    depth: null
  });

  console.log("\nÁlgebra Relacional:");
  console.log(ar);
} catch (error) {
  console.error("Error:", error.message);
}