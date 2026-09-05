/**
 * Convierte el árbol relacional de CLAPINO
 * en una expresión de Cálculo Relacional de Tuplas.
 *
 * Operaciones actualmente soportadas:
 * - Tabla
 * - Proyección
 * - Selección
 * - Comparaciones
 * - Operadores lógicos AND y OR
 * - Condiciones lógicas anidadas
 *
 * El árbol relacional actual trabaja con una única tabla.
 */
function treeToCRT(tree) {
  validateRelationalTree(tree);


  const context = extractCRTContext(tree);
  
  const tupleVariables = createTupleVariables(context.tables);

  const projectedPart = buildProjectedPart(
    context.attributes,
    context.tables,
    tupleVariables
  );

  const predicateParts =
    context.tables.map((table, index) => {
      const variable =
        context.tables.length === 1
          ? "t"
          : `t${index + 1}`;

      return `${table.name}(${variable})`;
    });

  if (context.condition) {
    const formattedCondition = conditionToCRT(
      context.condition,
      context.tables,
      tupleVariables
    );

    if (context.condition.type === "logical") {
      predicateParts.push(`(${formattedCondition})`);
    } else {
      predicateParts.push(formattedCondition);
    }
  }

  const predicate = predicateParts.join(" ∧ ");

  return `{ ${projectedPart} | ${predicate} }`;
}

function validateRelationalTree(tree) {
  if (!tree || typeof tree !== "object") {
    throw new Error("El árbol relacional no es válido");
  }

  const supportedNodeTypes = [
    "table",
    "selection",
    "projection",
    "product",
    "join"
  ];

  if (!supportedNodeTypes.includes(tree.type)) {
    throw new Error(
      `Tipo de nodo relacional no soportado en CRT: ${tree.type}`
    );
  }
}

function extractCRTContext(tree) {
  switch (tree.type) {
    case "table":
      validateTableNode(tree);

      return {
        tables: [tree],
        attributes: null,
        condition: null
      };

    case "selection": {
      if (!tree.relation) {
        throw new Error(
          "El nodo selección no contiene una relación"
        );
      }

      if (!tree.condition) {
        throw new Error(
          "El nodo selección no contiene una condición"
        );
      }

      const context = extractCRTContext(tree.relation);

      const combinedCondition =
        context.condition === null
          ? tree.condition
          : {
              type: "logical",
              operator: "AND",
              left: context.condition,
              right: tree.condition
            };

      return {
        ...context,
        condition: combinedCondition
      };
    }

    case "projection": {
      if (!tree.relation) {
        throw new Error(
          "El nodo proyección no contiene una relación"
        );
      }

      if (
        !Array.isArray(tree.attributes) ||
        tree.attributes.length === 0
      ) {
        throw new Error(
          "El nodo proyección no contiene atributos"
        );
      }

      const context = extractCRTContext(tree.relation);

      if (context.attributes !== null) {
        throw new Error(
          "El árbol contiene más de un nodo de proyección"
        );
      }

      return {
        ...context,
        attributes: tree.attributes
      };
    }

    case "product": {
      if (!tree.left || !tree.right) {
        throw new Error(
          "El nodo producto está incompleto"
        );
      }

      const leftContext =
        extractCRTContext(tree.left);

      const rightContext =
        extractCRTContext(tree.right);

      if (
        leftContext.attributes !== null ||
        rightContext.attributes !== null
      ) {
        throw new Error(
          "No se esperaba una proyección dentro del producto"
        );
      }

      if (
        leftContext.condition !== null ||
        rightContext.condition !== null
      ) {
        throw new Error(
          "No se esperaba una selección dentro del producto"
        );
      }

      return {
        tables: [
          ...leftContext.tables,
          ...rightContext.tables
        ],
        attributes: null,
        condition: null
      };
    }

    case "join": {
      if (
        !tree.left ||
        !tree.right ||
        !tree.condition
      ) {
        throw new Error(
          "El nodo JOIN está incompleto"
        );
      }

      const leftContext =
        extractCRTContext(tree.left);

      const rightContext =
        extractCRTContext(tree.right);

      if (
        leftContext.attributes !== null ||
        rightContext.attributes !== null
      ) {
        throw new Error(
          "No se esperaba una proyección dentro del JOIN"
        );
      }

      /*
      * Unimos las tablas de ambos lados.
      */
      const tables = [
        ...leftContext.tables,
        ...rightContext.tables
      ];

      /*
      * La condición del JOIN se convierte en
      * una condición normal del CRT.
      */
      let condition = tree.condition;

      /*
      * Por seguridad, si alguno de los lados
      * ya contiene una condición, la combinamos
      * mediante AND.
      */
      if (leftContext.condition) {
        condition = {
          type: "logical",
          operator: "AND",
          left: leftContext.condition,
          right: condition
        };
      }

      if (rightContext.condition) {
        condition = {
          type: "logical",
          operator: "AND",
          left: condition,
          right: rightContext.condition
        };
      }

      return {
        tables,
        attributes: null,
        condition
      };
    }

    default:
      throw new Error(
        `Tipo de nodo relacional no soportado en CRT: ${tree.type}`
      );
  }
}

function createTupleVariables(tables) {
  const tupleVariables = new Map();

  tables.forEach((table, index) => {
    const variable =
      tables.length === 1
        ? "t"
        : `t${index + 1}`;

    tupleVariables.set(
      table.alias || table.name,
      variable
    );

    /*
     * También registramos el nombre real
     * de la tabla para poder reconocer
     */
    tupleVariables.set(
      table.name,
      variable
    );
  });

  return tupleVariables;
}

function validateTableNode(tableNode) {
  if (!tableNode.name) {
    throw new Error("El nodo tabla no tiene nombre");
  }
}

function buildProjectedPart(
  attributes,
  tables,
  tupleVariables
) {

  if (attributes === null) {
    if (tables.length === 1) {
      return "t";
    }

    return tables
      .map((table, index) => `t${index + 1}`)
      .join(", ");
  }

  if (
    !Array.isArray(attributes) ||
    attributes.length === 0
  ) {
    throw new Error(
      "La proyección no contiene atributos válidos"
    );
  }

  return attributes
    .map((attribute) =>
      attributeToCRT(
        attribute,
        tables,
        tupleVariables
      )
    )
    .join(", ");
}

function attributeToCRT(
  attribute,
  tables,
  tupleVariables
) {
  validateAttribute(attribute);

  /*
   * Una sola tabla:
   */
  if (tables.length === 1) {
    return `t.${attribute.name}`;
  }

  /*
   * Varias tablas:
   * el atributo debe indicar a qué tabla
   * o alias pertenece.
   */
  if (!attribute.table) {
    throw new Error(
      `El atributo ${attribute.name} debe indicar su tabla cuando se utilizan varias tablas`
    );
  }

  const tupleVariable =
    tupleVariables.get(attribute.table);

  if (!tupleVariable) {
    throw new Error(
      `No se ha encontrado la tabla o alias ${attribute.table}`
    );
  }

  return `${tupleVariable}.${attribute.name}`;
}

function validateAttribute(attribute) {
  if (
    !attribute ||
    attribute.type !== "attribute" ||
    !attribute.name
  ) {
    throw new Error("Atributo relacional no válido");
  }
}

function validateAttributeTable(attribute, tableNode) {
  if (!attribute.table) {
    return;
  }

  const belongsToTable =
    attribute.table === tableNode.name;

  const belongsToAlias =
    tableNode.alias &&
    attribute.table === tableNode.alias;

  if (!belongsToTable && !belongsToAlias) {
    throw new Error(
      `El atributo ${attribute.table}.${attribute.name} ` +
      `no pertenece a la tabla ${tableNode.name}`
    );
  }
}

function conditionToCRT(
  condition,
  tables,
  tupleVariables
) {
  if (!condition || typeof condition !== "object") {
    throw new Error("La condición relacional no es válida");
  }

  switch (condition.type) {
    case "attribute":
      return attributeToCRT(
        condition,
        tables,
        tupleVariables
      );

    case "literal":
      return literalToCRT(condition);

    case "comparison":
      return comparisonToCRT(
        condition,
        tables,
        tupleVariables
      );

    case "logical":
      return logicalToCRT(
        condition,
        tables,
        tupleVariables
      );

    case "not":
      return notToCRT(
        condition,
        tables,
        tupleVariables
      );

    case "null_check":
      return nullCheckToCRT(
        condition,
        tables,
        tupleVariables
      );

    default:
      throw new Error(
        `Tipo de condición no soportado en CRT: ${condition.type}`
      );
  }
}

function literalToCRT(literal) {
  if (literal.valueType === "number") {
    return String(literal.value);
  }

  if (literal.valueType === "string") {
    return `'${escapeStringLiteral(literal.value)}'`;
  }

  throw new Error(
    `Tipo de literal no soportado en CRT: ${literal.valueType}`
  );
}

function escapeStringLiteral(value) {
  return String(value).replace(/'/g, "''");
}

function comparisonToCRT(
  comparison,
  tables,
  tupleVariables
) {
  if (
    !comparison.left ||
    !comparison.right ||
    !comparison.operator
  ) {
    throw new Error(
      "El nodo de comparación está incompleto"
    );
  }

  const left = conditionToCRT(
    comparison.left,
    tables,
    tupleVariables
  );

  const right = conditionToCRT(
    comparison.right,
    tables,
    tupleVariables
  );

  const operator = normalizeComparisonOperator(
    comparison.operator
  );

  return `${left} ${operator} ${right}`;
}

function logicalToCRT(
  logical,
  tables,
  tupleVariables
) {
  if (
    !logical.left ||
    !logical.right ||
    !logical.operator
  ) {
    throw new Error(
      "El nodo lógico está incompleto"
    );
  }

  const left = formatLogicalOperand(
    logical.left,
    tables,
    tupleVariables
  );

  const right = formatLogicalOperand(
    logical.right,
    tables,
    tupleVariables
  );

  const operator = normalizeLogicalOperator(
    logical.operator
  );

  return `${left} ${operator} ${right}`;
}

/**
 * Traduce una negación lógica a CRT.
 */
function notToCRT(
  notCondition,
  tables,
  tupleVariables
) {
  if (!notCondition.operand) {
    throw new Error(
      "El nodo NOT no contiene una condición"
    );
  }

  const operand = conditionToCRT(
    notCondition.operand,
    tables,
    tupleVariables
  );

  return `¬(${operand})`;
}

/**
 * Traduce una comprobación de NULL a CRT.
 
function nullCheckToCRT(
  nullCheck,
  tupleVariable,
  tableNode
) {
  if (
    !nullCheck.operand ||
    !nullCheck.operator
  ) {
    throw new Error(
      "El nodo NULL está incompleto"
    );
  }

  const operand = conditionToCRT(
    nullCheck.operand,
    tupleVariable,
    tableNode
  );

  if (
    nullCheck.operator !== "IS NULL" &&
    nullCheck.operator !== "IS NOT NULL"
  ) {
    throw new Error(
      `Operador NULL no soportado en CRT: ${nullCheck.operator}`
    );
  }

  return `${operand} ${nullCheck.operator}`;
}*/

function formatLogicalOperand(
  operand,
  tables,
  tupleVariables
) {
  const formattedOperand = conditionToCRT(
    operand,
    tables,
    tupleVariables
  );

  if (operand.type === "logical") {
    return `(${formattedOperand})`;
  }

  return formattedOperand;
}

function normalizeComparisonOperator(operator) {
  const normalizedOperator =
    String(operator).toUpperCase();

  if (
    normalizedOperator === "!=" ||
    normalizedOperator === "<>"
  ) {
    return "≠";
  }

  const supportedOperators = [
    "=",
    ">",
    "<",
    ">=",
    "<="
  ];

  if (supportedOperators.includes(normalizedOperator)) {
    return normalizedOperator;
  }

  throw new Error(
    `Operador de comparación no soportado en CRT: ${operator}`
  );
}

function normalizeLogicalOperator(operator) {
  const normalizedOperator =
    String(operator).toUpperCase();

  if (normalizedOperator === "AND") {
    return "∧";
  }

  if (normalizedOperator === "OR") {
    return "∨";
  }

  throw new Error(
    `Operador lógico no soportado en CRT: ${operator}`
  );
}

module.exports = {
  treeToCRT
};