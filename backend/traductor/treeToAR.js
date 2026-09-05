/**
 * Recorre el árbol relacional de CLAPINO
 * y genera una expresión de Álgebra Relacional.
 */
function treeToAR(tree) {
  if (!tree || typeof tree !== "object") {
    throw new Error("El árbol relacional no es válido");
  }

  switch (tree.type) {
    case "table":
      return tableToAR(tree);

    case "selection":
      return selectionToAR(tree);

    case "projection":
      return projectionToAR(tree);

    case "product":
      return productToAR(tree);
    case "join":
      return joinToAR(tree);

    default:
      throw new Error(
        `Tipo de nodo relacional no soportado: ${tree.type}`
      );
  }
}

/**
 * Traduce un nodo tabla.
 */
function tableToAR(node) {
  if (!node.name) {
    throw new Error("El nodo tabla no tiene nombre");
  }

  return node.name;
}

/**
 * Traduce un nodo selección.
 */
function selectionToAR(node) {
  const condition = conditionToAR(node.condition);
  const relation = treeToAR(node.relation);

  return `σ ${condition} (${relation})`;
}

/**
 * Traduce un nodo proyección.
 */
function projectionToAR(node) {
  if (
    !Array.isArray(node.attributes) ||
    node.attributes.length === 0
  ) {
    throw new Error(
      "El nodo proyección no contiene atributos"
    );
  }

  const attributes = node.attributes
    .map(attributeToAR)
    .join(", ");

  const relation = treeToAR(node.relation);

  return `π ${attributes} (${relation})`;
}

function productToAR(node) {
  if (!node.left || !node.right) {
    throw new Error(
      "El nodo producto está incompleto"
    );
  }

  const left = treeToAR(node.left);
  const right = treeToAR(node.right);

  return `(${left} × ${right})`;
}

function joinToAR(node) {
  if (
    !node.left ||
    !node.right ||
    !node.condition
  ) {
    throw new Error(
      "El nodo JOIN está incompleto"
    );
  }

  if (node.joinType !== "INNER") {
    throw new Error(
      `Tipo de JOIN no soportado en AR: ${node.joinType}`
    );
  }

  const left = treeToAR(node.left);
  const right = treeToAR(node.right);

  const condition =
    conditionToAR(node.condition);

  return `(${left} ⋈_{${condition}} ${right})`;
}

/**
 * Traduce un atributo.
 */
function attributeToAR(attribute) {
  if (
    !attribute ||
    attribute.type !== "attribute" ||
    !attribute.name
  ) {
    throw new Error("Atributo relacional no válido");
  }

  if (attribute.table) {
    return `${attribute.table}.${attribute.name}`;
  }

  return attribute.name;
}

/**
 * Recorre recursivamente el árbol de una condición.
 */
function conditionToAR(condition) {
  if (!condition || typeof condition !== "object") {
    throw new Error("La condición relacional no es válida");
  }

  switch (condition.type) {
    case "attribute":
      return attributeToAR(condition);

    case "literal":
      return literalToAR(condition);

    case "comparison":
      return comparisonToAR(condition);

    case "logical":
      return logicalToAR(condition);

    case "not":
      return notToAR(condition);

    case "null_check":
      return nullCheckToAR(condition);

    default:
      throw new Error(
        `Tipo de condición no soportado: ${condition.type}`
      );
  }
}

/**
 * Traduce un valor literal.
 */
function literalToAR(literal) {
  if (literal.valueType === "number") {
    return String(literal.value);
  }

  if (literal.valueType === "string") {
    return `'${literal.value}'`;
  }

  throw new Error(
    `Tipo de valor no soportado: ${literal.valueType}`
  );
}

/**
 * Traduce una comparación.
 */
function comparisonToAR(comparison) {
  const left = conditionToAR(comparison.left);
  const right = conditionToAR(comparison.right);
  const operator = normalizeComparisonOperator(
    comparison.operator
  );

  return `${left} ${operator} ${right}`;
}

/**
 * Traduce una operación lógica conservando
 * la agrupación del árbol mediante paréntesis.
 */
function logicalToAR(logical) {
  const left = formatLogicalOperand(logical.left);
  const right = formatLogicalOperand(logical.right);

  const operator = normalizeLogicalOperator(
    logical.operator
  );

  return `${left} ${operator} ${right}`;
}

/**
 * Traduce una negación lógica.
 *
 * NOT edad > 20
 *
 * se convierte en:
 *
 * ¬(edad > 20)
 */
function notToAR(notCondition) {
  if (!notCondition.operand) {
    throw new Error(
      "El nodo NOT no contiene una condición"
    );
  }

  const operand = conditionToAR(
    notCondition.operand
  );

  return `¬(${operand})`;
}

/**
 * Traduce una comprobación de NULL.
 */
function nullCheckToAR(nullCheck) {
  if (
    !nullCheck.operand ||
    !nullCheck.operator
  ) {
    throw new Error(
      "El nodo NULL está incompleto"
    );
  }

  const operand =
    conditionToAR(nullCheck.operand);

  if (
    nullCheck.operator !== "IS NULL" &&
    nullCheck.operator !== "IS NOT NULL"
  ) {
    throw new Error(
      `Operador NULL no soportado: ${nullCheck.operator}`
    );
  }

  return `${operand} ${nullCheck.operator}`;
}

/**
 * Traduce uno de los operandos de una operación lógica.
 *
 * Si el operando también es una operación lógica,
 * se rodea con paréntesis para conservar visualmente
 * la agrupación representada por el árbol.
 */
function formatLogicalOperand(operand) {
  const formattedOperand = conditionToAR(operand);

  if (operand.type === "logical") {
    return `(${formattedOperand})`;
  }

  return formattedOperand;
}

/**
 * Convierte operadores SQL a operadores de AR.
 */
function normalizeComparisonOperator(operator) {
  if (operator === "!=" || operator === "<>") {
    return "≠";
  }

  const supportedOperators = [
    "=",
    ">",
    "<",
    ">=",
    "<="
  ];

  if (supportedOperators.includes(operator)) {
    return operator;
  }

  throw new Error(
    `Operador de comparación no soportado: ${operator}`
  );
}

/**
 * Convierte operadores lógicos SQL a símbolos formales.
 */
function normalizeLogicalOperator(operator) {
  if (operator === "AND") {
    return "∧";
  }

  if (operator === "OR") {
    return "∨";
  }

  throw new Error(
    `Operador lógico no soportado: ${operator}`
  );
}

module.exports = {
  treeToAR
};