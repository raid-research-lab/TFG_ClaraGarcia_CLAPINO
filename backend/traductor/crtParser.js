/**
 * Convierte una expresión de Cálculo Relacional de Tuplas
 * en el árbol relacional propio de CLAPINO.
 *
 */
function crtToRelationalTree(crt) {
  if (typeof crt !== "string") {
    throw new Error("La consulta CRT debe ser un texto");
  }

  const cleanCRT = crt.trim();

  if (!cleanCRT) {
    throw new Error("La consulta CRT está vacía");
  }

  if (!cleanCRT.startsWith("{") || !cleanCRT.endsWith("}")) {
    throw new Error(
      "La consulta CRT debe estar encerrada entre llaves"
    );
  }

  /*
   * Eliminamos únicamente las llaves exteriores.
   */
  const innerContent = cleanCRT
    .slice(1, -1)
    .trim();

  /*
   * Separamos:
   *
   * t.nombre   de   ciclista(t) ∧ t.edad > 20
   */
  const {
    projectedText,
    predicateText
  } = splitCRTParts(innerContent);

  /*
   * Primero analizamos el predicado porque ahí se encuentra
   * la variable de tupla:
   *
   * ciclista(t)
   */
  const predicate = parsePredicate(predicateText);

  const projection = parseProjection(
    projectedText,
    predicate.variableToTable,
    predicate.variableToAlias
  );

  let relationalTree =
    createRelationTreeFromMemberships(
      predicate.memberships
    );

  /*
   * Si existe una condición adicional, añadimos
   * un nodo de selección.
   */
  if (predicate.condition) {
    relationalTree = {
      type: "selection",
      condition: predicate.condition,
      relation: relationalTree
    };
  }

  /*
   * Si se solicitan atributos concretos, añadimos
   * un nodo de proyección.
   *
   * Cuando la parte izquierda es simplemente "t",
   * se obtiene la tupla completa y no hace falta proyección.
   */
  if (projection.attributes) {
    relationalTree = {
      type: "projection",
      attributes: projection.attributes,
      relation: relationalTree
    };
  }

  return relationalTree;
}

/**
 * Construye la relación base a partir de las
 * pertenencias encontradas en CRT.
 */
function createRelationTreeFromMemberships(
  memberships
) {
  if (
    !Array.isArray(memberships) ||
    memberships.length === 0
  ) {
    throw new Error(
      "El predicado CRT no contiene relaciones"
    );
  }

  let relationalTree = {
    type: "table",
    name: memberships[0].tableName,
    alias: null
  };

  for (
    let index = 1;
    index < memberships.length;
    index += 1
  ) {
    relationalTree = {
      type: "product",
      left: relationalTree,
      right: {
        type: "table",
        name: memberships[index].tableName,
        alias: null
      }
    };
  }

  return relationalTree;
}

/* Genera alias únicos siguiente el orden en el que aparecen las tablas
  ciclista c - clasificación cl - carrera ca
*/
function createVariableAliases(memberships) {
  const usedAliases = new Set();
  const variableToAlias = new Map();

  for (const membership of memberships) {
    const tableName = membership.tableName;

    let alias = null;

    for (
      let length = 1;
      length <= tableName.length;
      length += 1
    ) {
      const candidate =
        tableName.slice(0, length);

      const formattedCandidate =
        candidate.charAt(0).toUpperCase() +
        candidate.slice(1).toLowerCase();

      if (
        !usedAliases.has(
          formattedCandidate.toLowerCase()
        )
      ) {
        alias = formattedCandidate;
        break;
      }
    }

    if (!alias) {
      throw new Error(
        `No se ha podido generar un alias único para la tabla ${tableName}`
      );
    }

    usedAliases.add(alias.toLowerCase());

    variableToAlias.set(
      membership.tupleVariable,
      alias
    );
  }

  return variableToAlias;
}

/**
 * Separa las dos partes principales del CRT:
 *
 * atributos | predicado
 *
 * La barra debe encontrarse fuera de paréntesis
 * y fuera de cadenas de texto.
 */
function splitCRTParts(content) {
  let parenthesisDepth = 0;
  let insideString = false;
  let separatorPosition = -1;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (character === "'") {
      /*
       * En SQL y en nuestro CRT una comilla simple
       * duplicada representa una comilla dentro del texto:
       *
       * 'O''Brien'
       */
      if (
        insideString &&
        content[index + 1] === "'"
      ) {
        index += 1;
        continue;
      }

      insideString = !insideString;
      continue;
    }

    if (insideString) {
      continue;
    }

    if (character === "(") {
      parenthesisDepth += 1;
      continue;
    }

    if (character === ")") {
      parenthesisDepth -= 1;

      if (parenthesisDepth < 0) {
        throw new Error(
          "Los paréntesis de la consulta CRT no están equilibrados"
        );
      }

      continue;
    }

    if (
      character === "|" &&
      parenthesisDepth === 0
    ) {
      if (separatorPosition !== -1) {
        throw new Error(
          "La consulta CRT contiene más de una barra vertical principal"
        );
      }

      separatorPosition = index;
    }
  }

  if (insideString) {
    throw new Error(
      "Hay una cadena de texto sin cerrar en la consulta CRT"
    );
  }

  if (parenthesisDepth !== 0) {
    throw new Error(
      "Los paréntesis de la consulta CRT no están equilibrados"
    );
  }

  if (separatorPosition === -1) {
    throw new Error(
      "La consulta CRT debe contener una barra vertical |"
    );
  }

  const projectedText = content
    .slice(0, separatorPosition)
    .trim();

  const predicateText = content
    .slice(separatorPosition + 1)
    .trim();

  if (!projectedText) {
    throw new Error(
      "Falta la parte proyectada antes de la barra vertical"
    );
  }

  if (!predicateText) {
    throw new Error(
      "Falta el predicado después de la barra vertical"
    );
  }

  return {
    projectedText,
    predicateText
  };
}

/**
 * Analiza la parte derecha:
 *
 * ciclista(t)
 *
 * o:
 *
 * ciclista(t) ∧ t.edad > 20
 */
/**
 * Analiza la parte derecha del CRT.
 *
 * Una tabla:
 *
 * ciclista(t) ∧ t.edad > 20
 *
 * Varias tablas:
 *
 * ciclista(t1) ∧ equipo(t2)
 * ∧ t1.nomeq = t2.nomeq
 */
function parsePredicate(predicateText) {
  const identifier =
    "[\\p{L}_][\\p{L}\\p{N}_]*";

  /*
   * Detecta una pertenencia al comienzo
   */
  const membershipPattern = new RegExp(
    `^(${identifier})\\s*\\(\\s*(${identifier})\\s*\\)`,
    "u"
  );

  let remainingPredicate =
    predicateText.trim();

  const memberships = [];

  /*
   * Vamos leyendo pertenencias consecutivas:
   */
  while (remainingPredicate) {
    const match =
      remainingPredicate.match(
        membershipPattern
      );

    /*
     * Si ya hemos encontrado relaciones y
     * lo siguiente no es otra pertenencia,
     * significa que empieza la condición.
     */
    if (!match) {
      break;
    }

    const tableName = match[1];
    const tupleVariable = match[2];

    /*
     * No permitimos utilizar la misma variable
     * para dos relaciones distintas.
     */
    if (
      memberships.some(
        (membership) =>
          membership.tupleVariable ===
          tupleVariable
      )
    ) {
      throw new Error(
        `La variable de tupla ${tupleVariable} está repetida`
      );
    }

    memberships.push({
      tableName,
      tupleVariable
    });

    /*
     * Eliminamos la pertenencia que acabamos
     * de reconocer.
     */
    remainingPredicate =
      remainingPredicate
        .slice(match[0].length)
        .trim();

    /*
     * Si no queda nada, hemos terminado.
     */
    if (!remainingPredicate) {
      break;
    }

    /*
     * Después de una pertenencia debe aparecer
     * una conjunción.
     */
    if (
      remainingPredicate.startsWith("∧")
    ) {
      remainingPredicate =
        remainingPredicate
          .slice(1)
          .trim();
    } else {
      const andMatch =
        remainingPredicate.match(/^AND\b/i);

      if (!andMatch) {
        throw new Error(
          "Las relaciones y condiciones CRT deben estar unidas mediante ∧ o AND"
        );
      }

      remainingPredicate =
        remainingPredicate
          .slice(andMatch[0].length)
          .trim();
    }

    if (!remainingPredicate) {
      throw new Error(
        "Falta una relación o condición después del operador lógico"
      );
    }

    /*
     * Si lo siguiente NO es otra pertenencia,
     * hemos llegado a la condición.
     */
    if (
      !membershipPattern.test(
        remainingPredicate
      )
    ) {
      break;
    }
  }

  if (memberships.length === 0) {
    throw new Error(
      "El predicado CRT debe comenzar indicando una relación, por ejemplo: ciclista(t)"
    );
  }

  /*
   * Creamos un mapa:
   */
  const variableToTable = new Map();

  memberships.forEach((membership) => {
    variableToTable.set(
      membership.tupleVariable,
      membership.tableName
    );
  });

  const variableToAlias = createVariableAliases(memberships);

  /*
   * Si no queda nada, no existe selección.
   */
  if (!remainingPredicate) {
    return {
      memberships,
      variableToTable,
      variableToAlias,
      condition: null
    };
  }

  const tokens = tokenizeCondition(
    remainingPredicate
  );

  const condition = parseConditionTokens(
    tokens,
    variableToTable,
    variableToAlias
  );

  return {
    memberships,
    variableToTable,
    variableToAlias,
    condition
  };
}

/**
 * Analiza la parte izquierda de la expresión.
 *
 * t
 *
 * significa tupla completa.
 *
 * t.nombre, t.edad
 *
 * significa proyección.
 */
function parseProjection(
  projectedText,
  variableToTable,
  variableToAlias
) {
  const projectedItems =
    splitProjectedAttributes(projectedText);

  const tupleVariables =
    Array.from(variableToTable.keys());

  /*
   * Una consulta de tupla completa o con varias tablas
   * no necesita proyección.
   */
  const projectsAllTuples =
    projectedItems.length ===
      tupleVariables.length &&
    projectedItems.every(
      (item) =>
        variableToTable.has(item)
    );

  if (projectsAllTuples) {
    return {
      attributes: null
    };
  }

  const attributes = projectedItems.map(
    (projectedItem) =>
      parseProjectedAttribute(
        projectedItem,
        variableToTable,
        variableToAlias
      )
  );

  return {
    attributes
  };
}

/**
 * Separa los atributos por comas.
 *
 * En el alcance actual los atributos no contienen
 * expresiones internas, pero hacemos la separación
 * de forma controlada.
 */
function splitProjectedAttributes(projectedText) {
  const attributes = projectedText
    .split(",")
    .map((attribute) => attribute.trim());

  if (
    attributes.length === 0 ||
    attributes.some((attribute) => !attribute)
  ) {
    throw new Error(
      "La lista de atributos proyectados no es válida"
    );
  }

  return attributes;
}

/**
 * Convierte:
 *
 * t.nombre
 *
 * en un nodo attribute.
 *
 * También admitimos:
 *
 * nombre
 *
 * para facilitar la escritura manual.
 */
function parseProjectedAttribute(
  projectedItem,
  variableToTable,
  variableToAlias
) {
  const qualifiedMatch =
    projectedItem.match(
      /^([\p{L}_][\p{L}\p{N}_]*)\.([\p{L}_][\p{L}\p{N}_]*)$/u
    );

  if (qualifiedMatch) {
    const variable = qualifiedMatch[1];
    const attributeName =
      qualifiedMatch[2];

    /*
     * Comprobamos que t1, t2, etc.
     * pertenezcan realmente a alguna relación.
     */
    if (!variableToTable.has(variable)) {
      throw new Error(
        `La variable de tupla ${variable} no está definida`
      );
    }

    return {
      type: "attribute",
      table:
        variableToTable.size === 1
          ? null
          : variableToAlias.get(variable),
      name: attributeName,
      alias: null
    };
  }

  /*
   * Atributo sin variable.
   */
  const simpleAttributeMatch =
    projectedItem.match(
      /^[\p{L}_][\p{L}\p{N}_]*$/u
    );

  if (!simpleAttributeMatch) {
    throw new Error(
      `Atributo proyectado no válido: ${projectedItem}`
    );
  }

  /*
   * Con varias tablas no sabemos a cuál
   * pertenece un atributo sin cualificar.
   */
  if (variableToTable.size > 1) {
    throw new Error(
      `El atributo ${projectedItem} debe indicar su variable de tupla cuando existen varias relaciones`
    );
  }

  return {
    type: "attribute",
    table: null,
    name: projectedItem,
    alias: null
  };
}

/**
 * Convierte la condición CRT en tokens.
 *
 * Ejemplo:
 *
 * t.edad > 20 ∧ t.nomeq = 'Banesto'
 *
 * se convierte en una lista con:
 *
 * identifier, dot, identifier, operator, number,
 * logical, identifier, dot, identifier, operator, string
 */
function tokenizeCondition(conditionText) {
  const tokens = [];
  let position = 0;

  while (position < conditionText.length) {
    const character = conditionText[position];

    /*
     * Ignoramos espacios, tabulaciones y saltos de línea.
     */
    if (/\s/u.test(character)) {
      position += 1;
      continue;
    }

    /*
     * Paréntesis.
     */
    if (character === "(") {
      tokens.push({
        type: "left_parenthesis",
        value: character
      });

      position += 1;
      continue;
    }

    if (character === ")") {
      tokens.push({
        type: "right_parenthesis",
        value: character
      });

      position += 1;
      continue;
    }

    /*
     * Punto de una referencia como t.edad.
     */
    if (character === ".") {
      tokens.push({
        type: "dot",
        value: character
      });

      position += 1;
      continue;
    }

    /*
    * Negación lógica formal.
    */
    if (character === "¬") {
      tokens.push({
        type: "not_operator",
        value: "NOT"
      });

      position += 1;
      continue;
    }

    /*
     * Operadores lógicos formales.
     */
    if (character === "∧" || character === "∨") {
      tokens.push({
        type: "logical_operator",
        value:
          character === "∧" ? "AND" : "OR"
      });

      position += 1;
      continue;
    }

    /*
     * Desigualdad formal.
     */
    if (character === "≠") {
      tokens.push({
        type: "comparison_operator",
        value: "!="
      });

      position += 1;
      continue;
    }

    /*
     * Operadores de dos caracteres.
     */
    const twoCharacterOperator =
      conditionText.slice(
        position,
        position + 2
      );

    if (
      [">=", "<=", "!=", "<>"].includes(
        twoCharacterOperator
      )
    ) {
      tokens.push({
        type: "comparison_operator",
        value: twoCharacterOperator
      });

      position += 2;
      continue;
    }

    /*
     * Operadores de un carácter.
     */
    if ([">", "<", "="].includes(character)) {
      tokens.push({
        type: "comparison_operator",
        value: character
      });

      position += 1;
      continue;
    }

    /*
     * Cadenas entre comillas simples.
     */
    if (character === "'") {
      const {
        value,
        nextPosition
      } = readStringLiteral(
        conditionText,
        position
      );

      tokens.push({
        type: "string",
        value
      });

      position = nextPosition;
      continue;
    }

    /*
     * Valores numéricos positivos o negativos.
     */
    const numberMatch = conditionText
      .slice(position)
      .match(/^-?\d+(?:\.\d+)?/);

    if (numberMatch) {
      tokens.push({
        type: "number",
        value: Number(numberMatch[0])
      });

      position += numberMatch[0].length;
      continue;
    }

    /*
     * Identificadores y palabras AND / OR.
     */
    const identifierMatch = conditionText
      .slice(position)
      .match(
        /^[\p{L}_][\p{L}\p{N}_]*/u
      );

    if (identifierMatch) {
      const identifierValue =
        identifierMatch[0];

      const normalizedIdentifier =
        identifierValue.toUpperCase();

      if (
        normalizedIdentifier === "AND" ||
        normalizedIdentifier === "OR"
      ) {
        tokens.push({
          type: "logical_operator",
          value: normalizedIdentifier
        });
      } else if (
        normalizedIdentifier === "NOT"
      ) {
        tokens.push({
          type: "not_operator",
          value: "NOT"
        });
      } else {
        tokens.push({
          type: "identifier",
          value: identifierValue
        });
      }

      position += identifierValue.length;
      continue;
    }

    throw new Error(
      `Símbolo no reconocido en la condición CRT: ${character}`
    );
  }

  if (tokens.length === 0) {
    throw new Error(
      "La condición CRT está vacía"
    );
  }

  return tokens;
}

/**
 * Lee una cadena como:
 *
 * 'Banesto'
 *
 * o:
 *
 * 'O''Brien'
 */
function readStringLiteral(text, startPosition) {
  let position = startPosition + 1;
  let value = "";

  while (position < text.length) {
    const character = text[position];

    if (character === "'") {
      /*
       * Dos comillas simples representan
       * una comilla dentro del valor.
       */
      if (text[position + 1] === "'") {
        value += "'";
        position += 2;
        continue;
      }

      return {
        value,
        nextPosition: position + 1
      };
    }

    value += character;
    position += 1;
  }

  throw new Error(
    "Hay una cadena de texto sin cerrar en la condición CRT"
  );
}

/**
 * Crea el analizador recursivo de condiciones.
 *
 * 1. Paréntesis
 * 2. Comparaciones
 * 3. AND
 * 4. OR
 */
function parseConditionTokens(
  tokens,
  variableToTable,
  variableToAlias
) {
  let currentPosition = 0;

  function currentToken() {
    return tokens[currentPosition] || null;
  }

  function consumeToken(expectedType) {
    const token = currentToken();

    if (!token || token.type !== expectedType) {
      throw new Error(
        `Se esperaba ${expectedType} en la condición CRT`
      );
    }

    currentPosition += 1;
    return token;
  }

  /**
   * Nivel OR.
   */
  function parseOrExpression() {
    let left = parseAndExpression();

    while (
      currentToken() &&
      currentToken().type ===
        "logical_operator" &&
      currentToken().value === "OR"
    ) {
      currentPosition += 1;

      const right = parseAndExpression();

      left = {
        type: "logical",
        operator: "OR",
        left,
        right
      };
    }

    return left;
  }

  /**
   * Nivel AND.
   */
  function parseAndExpression() {
    let left = parseNotExpression();

    while (
      currentToken() &&
      currentToken().type ===
        "logical_operator" &&
      currentToken().value === "AND"
    ) {
      currentPosition += 1;

      const right = parseNotExpression();

      left = {
        type: "logical",
        operator: "AND",
        left,
        right
      };
    }

    return left;
  }

  /**
   * Nivel NOT.
   *
   * NOT tiene mayor prioridad que AND y OR.
   */
  function parseNotExpression() {
    if (
      currentToken() &&
      currentToken().type === "not_operator"
    ) {
      currentPosition += 1;

      return {
        type: "not",
        operand: parseNotExpression()
      };
    }

    return parseLogicalPrimary();
  }

  /**
   * Una expresión lógica primaria puede ser:
   *
   * - una comparación;
   * - una condición entre paréntesis.
   */
  function parseLogicalPrimary() {
    if (
      currentToken() &&
      currentToken().type ===
        "left_parenthesis"
    ) {
      currentPosition += 1;

      const expression = parseOrExpression();

      consumeToken("right_parenthesis");

      return expression;
    }

    return parseComparison();
  }

  /**
   * Comparación:
   *
   * atributo operador valor
   */
  function parseComparison() {
    const left = parseOperand();

    const operatorToken =
      consumeToken("comparison_operator");

    const right = parseOperand();

    return {
      type: "comparison",
      operator: operatorToken.value,
      left,
      right
    };
  }

  /**
   * Un operando puede ser: atributo, número, texto.
   */
  function parseOperand() {
    const token = currentToken();

    if (!token) {
      throw new Error(
        "Falta un operando en la condición CRT"
      );
    }

    if (token.type === "number") {
      currentPosition += 1;

      return {
        type: "literal",
        valueType: "number",
        value: token.value
      };
    }

    if (token.type === "string") {
      currentPosition += 1;

      return {
        type: "literal",
        valueType: "string",
        value: token.value
      };
    }

    if (token.type === "identifier") {
      currentPosition += 1;

      let variable = null;
      let attributeName = token.value;

      if (
        currentToken() &&
        currentToken().type === "dot"
      ) {
        currentPosition += 1;

        const attributeToken =
          consumeToken("identifier");

        variable = token.value;
        attributeName =
          attributeToken.value;

        if (!variableToTable.has(variable)) {
          throw new Error(
            `La variable ${variable} no está definida en el predicado CRT`
          );
        }

        return {
          type: "attribute",
          table:
            variableToTable.size === 1
              ? null
              : variableToAlias.get(variable),
          name: attributeName
        };
      }

      if (variableToTable.size > 1) {
        throw new Error(
          `El atributo ${attributeName} debe indicar su variable de tupla cuando existen varias relaciones`
        );
      }

      return {
        type: "attribute",
        table: null,
        name: attributeName
      };
    }

    throw new Error(
      `Operando no válido en la condición CRT: ${token.value}`
    );
  }

  const condition = parseOrExpression();

  if (currentPosition !== tokens.length) {
    const unexpectedToken =
      currentToken();

    throw new Error(
      `Elemento inesperado en la condición CRT: ${unexpectedToken.value}`
    );
  }

  return condition;
}

module.exports = {
  crtToRelationalTree
};