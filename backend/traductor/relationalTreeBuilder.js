/**
 * Convierte el AST generado por node-sql-parser
 * en el árbol relacional propio de CLAPINO.
 */
function sqlAstToRelationalTree(ast) {
  validateSelectAst(ast);

  /*
   * El árbol empieza siempre por la relación indicada
   * en la cláusula FROM.
   */
  let relationTree = createFromTree(ast.from);

  /*
   * Si existe WHERE, envolvemos la tabla
   * dentro de un nodo de selección.
   */
  if (ast.where) {
    relationTree = {
      type: "selection",
      condition: convertCondition(ast.where),
      relation: relationTree
    };
  }

  /*
   * Si SELECT contiene columnas concretas,
   * envolvemos la relación en una proyección.
   *
   * SELECT * no necesita nodo de proyección.
   */
  if (!isSelectAll(ast.columns)) {
    relationTree = {
      type: "projection",
      attributes: convertColumns(ast.columns),
      relation: relationTree
    };
  }

  return relationTree;
}

/**
 * Comprueba que el AST pertenece a una consulta
 * que CLAPINO puede transformar en esta fase.
 */
function validateSelectAst(ast) {
  if (!ast || typeof ast !== "object") {
    throw new Error("El AST recibido no es válido");
  }

  if (ast.type !== "select") {
    throw new Error("CLAPINO solo admite consultas SELECT");
  }

  if (!Array.isArray(ast.from) || ast.from.length === 0) {
    throw new Error("La consulta debe contener una cláusula FROM");
  }

  for (const fromItem of ast.from) {
    if (!fromItem.table) {
      throw new Error(
        "No se ha podido identificar una de las tablas"
      );
    }
  }

  /*Comprobar que dos tablas no tengan el mismo alias*/

  const usedAliases = new Set();

  for (const fromItem of ast.from) {
    if (!fromItem.as) {
      continue;
    }

    const normalizedAlias =
      fromItem.as.toLowerCase();

    if (usedAliases.has(normalizedAlias)) {
      throw new Error(
        `No se puede utilizar el mismo alias '${fromItem.as}' para dos tablas distintas`
      );
    }

    usedAliases.add(normalizedAlias);
  }

  if (!Array.isArray(ast.columns) || ast.columns.length === 0) {
    throw new Error("No se han podido identificar las columnas");
  }

  if (ast.groupby) {
    throw new Error("GROUP BY todavía no está soportado");
  }

  if (ast.having) {
    throw new Error("HAVING todavía no está soportado");
  }
}

/**
 * Construye un nodo de tipo tabla.
 */
function createTableNode(fromItem) {
  return {
    type: "table",
    name: fromItem.table,
    alias: fromItem.as || null
  };
}

function createFromTree(fromItems) {
  if (
    !Array.isArray(fromItems) ||
    fromItems.length === 0
  ) {
    throw new Error(
      "La cláusula FROM no contiene tablas"
    );
  }

  let relationTree =
    createTableNode(fromItems[0]);

  for (
    let index = 1;
    index < fromItems.length;
    index += 1
  ) {
    const fromItem = fromItems[index];

    if (fromItem.join) {
      relationTree = createJoinNode(
        relationTree,
        fromItem
      );

      continue;
    }

    relationTree = {
      type: "product",
      left: relationTree,
      right: createTableNode(fromItem)
    };
  }

  return relationTree;
}

function createJoinNode(
  leftRelation,
  fromItem
) {
  const joinType =
    String(fromItem.join).toUpperCase();

  if (joinType !== "INNER JOIN") {
    throw new Error(
      `Tipo de JOIN todavía no soportado: ${fromItem.join}`
    );
  }

  if (!fromItem.on) {
    throw new Error(
      "El INNER JOIN debe contener una condición ON"
    );
  }

  return {
    type: "join",
    joinType: "INNER",
    condition: convertCondition(
      fromItem.on
    ),
    left: leftRelation,
    right: createTableNode(fromItem)
  };
}

/**
 * Comprueba si las columnas representan SELECT *.
 */
function isSelectAll(columns) {
  return (
    columns.length === 1 &&
    columns[0].expr &&
    columns[0].expr.type === "column_ref" &&
    columns[0].expr.column === "*"
  );
}

/**
 * Convierte las columnas del AST en atributos
 * del árbol relacional de CLAPINO.
 */
function convertColumns(columns) {
  return columns.map((columnItem) => {
    const expression = columnItem.expr;

    if (!expression || expression.type !== "column_ref") {
      throw new Error(
        "En esta fase solo se permiten columnas simples en SELECT"
      );
    }

    return {
      type: "attribute",
      table: expression.table || null,
      name: expression.column,
      alias: columnItem.as || null
    };
  });
}

/**
 * Convierte recursivamente una condición del AST SQL
 * en una condición propia de CLAPINO.
 */
function convertCondition(expression) {
  if (!expression || typeof expression !== "object") {
    throw new Error("La condición WHERE no es válida");
  }

  /*
   * Referencia a una columna, por ejemplo:
   * edad
   * ciclista.edad
   */
  if (expression.type === "column_ref") {
    return {
      type: "attribute",
      table: expression.table || null,
      name: expression.column
    };
  }

  /*
   * Valor numérico, por ejemplo:
   * 20
   */
  if (expression.type === "number") {
    return {
      type: "literal",
      valueType: "number",
      value: expression.value
    };
  }

  /*
   * Texto entre comillas, por ejemplo:
   * 'Banesto'
   */
  if (
    expression.type === "single_quote_string" ||
    expression.type === "string"
  ) {
    return {
      type: "literal",
      valueType: "string",
      value: expression.value
    };
  }

  /*
  * Expresión unaria:
  *
  * NOT edad > 20
  */
  if (expression.type === "unary_expr") {
    const operator = expression.operator.toUpperCase();

    if (operator !== "NOT") {
      throw new Error(
        `Operador unario no soportado: ${expression.operator}`
      );
    }

    return {
      type: "not",
      operand: convertCondition(expression.expr)
    };
  }

  /*
  * Algunas expresiones NOT entre paréntesis son
  * representadas por node-sql-parser como una función:
  *
  * NOT (edad > 20 AND nomeq = 'Banesto')
  */
  if (expression.type === "function") {
    const functionName =
      expression.name &&
      expression.name.name &&
      expression.name.name[0] &&
      expression.name.name[0].value;

    if (
      typeof functionName === "string" &&
      functionName.toUpperCase() === "NOT"
    ) {
      const args =
        expression.args &&
        expression.args.value;

      if (
        !Array.isArray(args) ||
        args.length !== 1
      ) {
        throw new Error(
          "La expresión NOT debe contener exactamente una condición"
        );
      }

      return {
        type: "not",
        operand: convertCondition(args[0])
      };
    }

    throw new Error(
      `Función no soportada: ${functionName || "desconocida"}`
    );
  }

  /*
   * Expresión con operador y dos operandos:
   *
   * edad > 20
   * edad > 20 AND nomeq = 'Banesto'
   */
  if (expression.type === "binary_expr") {
    const operator =
      expression.operator.toUpperCase();
    
    /*
    * BETWEEN:
    */
    if (
      operator === "BETWEEN" ||
      operator === "NOT BETWEEN"
    ) {
      const values =
        expression.right &&
        expression.right.type === "expr_list"
          ? expression.right.value
          : null;

      if (
        !Array.isArray(values) ||
        values.length !== 2
      ) {
        throw new Error(
          "BETWEEN debe contener exactamente dos valores"
        );
      }

      const attribute =
        convertCondition(expression.left);

      const lowerLimit =
        convertCondition(values[0]);

      const upperLimit =
        convertCondition(values[1]);

      const betweenCondition = {
        type: "logical",
        operator: "AND",

        left: {
          type: "comparison",
          operator: ">=",
          left: attribute,
          right: lowerLimit
        },

        right: {
          type: "comparison",
          operator: "<=",
          left: attribute,
          right: upperLimit
        }
      };

      /*
      * NOT BETWEEN se representa reutilizando
      * el nodo NOT que ya soporta CLAPINO.
      */
      if (operator === "NOT BETWEEN") {
        return {
          type: "not",
          operand: betweenCondition
        };
      }

      return betweenCondition;
    }

    /*
    * IN
    */
    if (
      operator === "IN" ||
      operator === "NOT IN"
    ) {
      const values =
        expression.right &&
        expression.right.type === "expr_list"
          ? expression.right.value
          : null;

      if (
        !Array.isArray(values) ||
        values.length === 0
      ) {
        throw new Error(
          "IN debe contener al menos un valor"
        );
      }

      const attribute =
        convertCondition(expression.left);

      const comparisons = values.map(
        (valueExpression) => ({
          type: "comparison",
          operator: "=",
          left: attribute,
          right: convertCondition(valueExpression)
        })
      );

      let inCondition = comparisons[0];

      for (
        let index = 1;
        index < comparisons.length;
        index += 1
      ) {
        inCondition = {
          type: "logical",
          operator: "OR",
          left: inCondition,
          right: comparisons[index]
        };
      }

      /*
      * NOT IN 
      */
      if (operator === "NOT IN") {
        return {
          type: "not",
          operand: inCondition
        };
      }

      return inCondition;
    }
    
    /*
    * Comprobaciones de NULL:
    */
    if (
      (operator === "IS" ||
        operator === "IS NOT") &&
      expression.right &&
      expression.right.type === "null"
    ) {
      return {
        type: "null_check",
        operator:
          operator === "IS"
            ? "IS NULL"
            : "IS NOT NULL",
        operand: convertCondition(
          expression.left
        )
      };
    }

    return {
      type: getBinaryExpressionType(
        expression.operator
      ),
      operator,
      left: convertCondition(expression.left),
      right: convertCondition(expression.right)
    };
  }

  throw new Error(
    `Tipo de expresión no soportado: ${expression.type}`
  );
}

/**
 * Distingue entre operadores lógicos y comparaciones.
 */
function getBinaryExpressionType(operator) {
  const normalizedOperator = operator.toUpperCase();

  if (
    normalizedOperator === "AND" ||
    normalizedOperator === "OR"
  ) {
    return "logical";
  }

  const comparisonOperators = [
    "=",
    "!=",
    "<>",
    ">",
    "<",
    ">=",
    "<="
  ];

  if (comparisonOperators.includes(normalizedOperator)) {
    return "comparison";
  }

  throw new Error(
    `Operador no soportado: ${operator}`
  );
}

module.exports = {
  sqlAstToRelationalTree
};