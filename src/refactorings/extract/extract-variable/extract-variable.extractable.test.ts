import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - Patterns we can extract", () => {
  testEach<{
    code: Code;
    selection: Selection;
    expected: Code;
  }>(
    "should extract",
    [
      {
        description: "a string",
        code: `console.log("Hello!");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const hello = "Hello!";
console.log(hello);`
      },
      {
        description: "a string that starts with a number",
        code: `console.log("2019-01-01");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "2019-01-01";
console.log(extracted);`
      },
      {
        description: "an empty string",
        code: `console.log("");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "";
console.log(extracted);`
      },
      {
        description: "a 1-char string",
        code: `console.log("T");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "T";
console.log(extracted);`
      },
      {
        description: "a string being a keyword",
        code: `console.log("const");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "const";
console.log(extracted);`
      },
      {
        description: "a string without chars inside",
        code: `console.log("===");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "===";
console.log(extracted);`
      },
      {
        description: "a number",
        code: `console.log(12.5);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = 12.5;
console.log(extracted);`
      },
      {
        description: "a boolean",
        code: `console.log(false);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = false;
console.log(extracted);`
      },
      {
        description: "null",
        code: `console.log(null);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = null;
console.log(extracted);`
      },
      {
        description: "undefined",
        code: `console.log(undefined);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = undefined;
console.log(extracted);`
      },
      {
        description: "an array",
        code: `console.log([1, 2, 'three', [true, null]]);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = [1, 2, 'three', [true, null]];
console.log(extracted);`
      },
      {
        description: "an array (multi-lines)",
        code: `console.log([
  1,
  'Two',
  [true, null]
]);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = [
  1,
  'Two',
  [true, null]
];
console.log(extracted);`
      },
      {
        description: "a named function",
        code: `console.log(function sayHello() {
  return "Hello!";
});`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = function sayHello() {
  return "Hello!";
};
console.log(extracted);`
      },
      {
        description: "an arrow function",
        code: `console.log(() => "Hello!");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = () => "Hello!";
console.log(extracted);`
      },
      {
        description: "a function call",
        code: `console.log(sayHello("World"));`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = sayHello("World");
console.log(extracted);`
      },
      {
        description: "the correct variable when we have many",
        code: `console.log("Hello");
console.log("the", "World!", "Alright.");
console.log("How are you doing?");`,
        selection: Selection.cursorAt(1, 19),
        expected: `console.log("Hello");
const world = "World!";
console.log("the", world, "Alright.");
console.log("How are you doing?");`
      },
      {
        description: "an element in a multi-lines array",
        code: `const SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact"
];`,
        selection: Selection.cursorAt(2, 2),
        expected: `const javascriptreact = "javascriptreact";
const SUPPORTED_LANGUAGES = [
  "javascript",
  javascriptreact,
  "typescript",
  "typescriptreact"
];`
      },
      {
        description: "an element nested in a multi-lines array",
        code: `console.log([
  1,
  [
    {
      hello: "Hello!"
    }
  ]
]);`,
        selection: Selection.cursorAt(4, 13),
        expected: `const hello = "Hello!";
console.log([
  1,
  [
    {
      hello
    }
  ]
]);`
      },
      {
        description: "a spread variable",
        code: `console.log({ ...foo.bar });`,
        selection: Selection.cursorAt(0, 22),
        expected: `const { bar } = foo;
console.log({ ...bar });`
      },
      {
        description: "a spread variable, cursor on spread",
        code: `console.log({ ...foo.bar });`,
        selection: Selection.cursorAt(0, 16),
        expected: `const extracted = { ...foo.bar };
console.log(extracted);`
      },
      {
        description: "a spread function result",
        code: `console.log({
  ...getInlinableCode(declaration),
  id: "name"
});`,
        selection: Selection.cursorAt(1, 11),
        expected: `const extracted = getInlinableCode(declaration);
console.log({
  ...extracted,
  id: "name"
});`
      },
      {
        description:
          "a valid path when cursor is on a part of member expression",
        code: `console.log(path.node.name);`,
        selection: Selection.cursorAt(0, 17),
        expected: `const { node } = path;
console.log(node.name);`
      },
      {
        description:
          "a member expression when property name is not in camel case",
        code: `console.log(path.some_node.name);`,
        selection: Selection.cursorAt(0, 17),
        expected: `const { some_node } = path;
console.log(some_node.name);`
      },
      {
        description: "a member expression when property name is too long",
        code: `console.log(path.somethingVeryVeryVeryLongThatWontFit.name);`,
        selection: Selection.cursorAt(0, 17),
        expected: `const { somethingVeryVeryVeryLongThatWontFit } = path;
console.log(somethingVeryVeryVeryLongThatWontFit.name);`
      },
      {
        description: "member expression with computed value",
        code: `console.log(this.items[i].name);`,
        selection: Selection.cursorAt(0, 23),
        expected: `const extracted = this.items[i];
console.log(extracted.name);`
      },
      {
        description: "a return value of a function",
        code: `function getMessage() {
  return "Hello!";
}`,
        selection: Selection.cursorAt(1, 9),
        expected: `function getMessage() {
  const hello = "Hello!";
  return hello;
}`
      },
      {
        description: "an assigned variable",
        code: `const message = "Hello!";`,
        selection: Selection.cursorAt(0, 16),
        expected: `const hello = "Hello!";
const message = hello;`
      },
      {
        description: "a class property assignment",
        code: `class Logger {
  message = "Hello!";
}`,
        selection: Selection.cursorAt(1, 12),
        expected: `const hello = "Hello!";
class Logger {
  message = hello;
}`
      },
      {
        description: "a computed class property",
        code: `class Logger {
  [key] = "value";
}`,
        selection: Selection.cursorAt(1, 3),
        expected: `const extracted = key;
class Logger {
  [extracted] = "value";
}`
      },
      {
        description: "an interpolated string when cursor is on a subpart of it",
        code: "console.log(`Hello ${world}! How are you doing?`);",
        selection: Selection.cursorAt(0, 15),
        expected: `const extracted = \`Hello \${world}! How are you doing?\`;
console.log(extracted);`
      },
      {
        description: "an if statement (whole statement)",
        code: "if (parents.length > 0 && type === 'refactor') doSomething();",
        selection: new Selection([0, 4], [0, 45]),
        expected: `const extracted = parents.length > 0 && type === 'refactor';
if (extracted) doSomething();`
      },
      {
        description: "an if statement (part of it)",
        code: "if (parents.length > 0 && type === 'refactor') doSomething();",
        selection: new Selection([0, 4], [0, 22]),
        expected: `const extracted = parents.length > 0;
if (extracted && type === 'refactor') doSomething();`
      },
      {
        description: "a multi-lines if statement (whole statement)",
        code: `if (
  parents.length > 0 &&
  type === 'refactor'
) doSomething();`,
        selection: new Selection([1, 2], [2, 21]),
        expected: `const extracted = parents.length > 0 &&
  type === 'refactor';
if (
  extracted
) doSomething();`
      },
      {
        description: "a multi-lines if statement (part of it)",
        code: `if (
  parents.length > 0 &&
  type === 'refactor'
) doSomething();`,
        selection: new Selection([2, 2], [2, 21]),
        expected: `const extracted = type === 'refactor';
if (
  parents.length > 0 &&
  extracted
) doSomething();`
      },
      {
        description: "a while statement",
        code:
          "while (parents.length > 0 && type === 'refactor') doSomething();",
        selection: new Selection([0, 7], [0, 48]),
        expected: `const extracted = parents.length > 0 && type === 'refactor';
while (extracted) doSomething();`
      },
      {
        description: "a case statement",
        code: `switch (text) {
  case "Hello!":
  default:
    break;
}`,
        selection: Selection.cursorAt(1, 7),
        expected: `const hello = "Hello!";
switch (text) {
  case hello:
  default:
    break;
}`
      },
      {
        description: "an unamed function parameter when cursor is inside",
        code: `console.log(function () {
  return "Hello!";
});`,
        selection: Selection.cursorAt(1, 0),
        expected: `const extracted = function () {
  return "Hello!";
};
console.log(extracted);`
      },
      {
        description: "an exported variable declaration",
        code: `export const something = {
  foo: "bar"
};`,
        selection: Selection.cursorAt(1, 9),
        expected: `const foo = "bar";
export const something = {
  foo
};`
      },
      {
        description: "a value inside an arrow function",
        code: `() => (
  console.log("Hello")
)`,
        selection: Selection.cursorAt(1, 16),
        expected: `const hello = "Hello";
() => (
  console.log(hello)
)`
      },
      {
        description: "a multi-lines ternary",
        code: `function getText() {
  return isValid
    ? "yes"
    : "no";
}`,
        selection: Selection.cursorAt(2, 8),
        expected: `function getText() {
  const yes = "yes";
  return isValid
    ? yes
    : "no";
}`
      },
      {
        description: "a multi-lines unary expression",
        code: `if (
  !(threshold > 10 || isPaused)
) {
  console.log("Ship it");
}`,
        selection: Selection.cursorAt(1, 17),
        expected: `const extracted = 10;
if (
  !(threshold > extracted || isPaused)
) {
  console.log("Ship it");
}`
      },
      {
        description: "a class instantiation (cursor on new expression)",
        code: `console.log(new Card("jack"));`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = new Card("jack");
console.log(extracted);`
      },
      {
        description: "a class instantiation (cursor on class identifier)",
        code: `console.log(new Card("jack"));`,
        selection: Selection.cursorAt(0, 16),
        expected: `const extracted = new Card("jack");
console.log(extracted);`
      },
      {
        description: "a thrown error",
        code: `throw new Error("It failed");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = new Error("It failed");
throw extracted;`
      },
      {
        description: "a call expression parameter (multi-lines)",
        code: `createIfStatement(
  parentPath.node.operator,
  parentPath.node.left,
  node.consequent
);`,
        selection: Selection.cursorAt(1, 20),
        expected: `const { operator } = parentPath.node;
createIfStatement(
  operator,
  parentPath.node.left,
  node.consequent
);`
      },
      {
        description: "a conditional expression (multi-lines)",
        code: `const type = !!(
  path.node.loc.length > 0
) ? "with-loc"
  : "without-loc";`,
        selection: Selection.cursorAt(1, 17),
        expected: `const { length } = path.node.loc;
const type = !!(
  length > 0
) ? "with-loc"
  : "without-loc";`
      },
      {
        description: "a value in a new Expression",
        code: `new Author(
  "name"
);`,
        selection: Selection.cursorAt(1, 2),
        expected: `const name = "name";
new Author(
  name
);`
      },
      {
        description: "a value in an Array argument of a function",
        code: `doSomething([
  getValueOf("name")
]);`,
        selection: Selection.cursorAt(1, 2),
        expected: `const extracted = getValueOf("name");
doSomething([
  extracted
]);`
      },
      {
        description: "a new Expression in an Array argument of a function",
        code: `doSomething([
  new Author("Eliott")
]);`,
        selection: Selection.cursorAt(1, 2),
        expected: `const extracted = new Author("Eliott");
doSomething([
  extracted
]);`
      },
      {
        description: "a value in a binary expression",
        code: `console.log(
  currentValue >
  10
);`,
        selection: Selection.cursorAt(2, 2),
        expected: `const extracted = 10;
console.log(
  currentValue >
  extracted
);`
      },
      {
        description: "an arrow function (cursor on params)",
        code: `const sayHello = (name) => {
  console.log(name);
};`,
        selection: Selection.cursorAt(0, 20),
        expected: `const extracted = (name) => {
  console.log(name);
};
const sayHello = extracted;`
      },
      {
        description: "a for statement",
        code: `for (var i = 0; i < this.items.length; i++) {}`,
        selection: Selection.cursorAt(0, 27),
        expected: `const { items } = this;
for (var i = 0; i < items.length; i++) {}`
      },
      {
        description: "with tabs",
        code: `function test() {
	const myVar = {
		someArray: [{ somethingNested: 42 }]
	};
	console.log(myVar.someArray[0].somethingNested);
}`,
        selection: Selection.cursorAt(4, 25),
        expected: `function test() {
	const myVar = {
		someArray: [{ somethingNested: 42 }]
	};
	const { someArray } = myVar;
	console.log(someArray[0].somethingNested);
}`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doExtractVariable(code, selection);
      expect(result.code).toBe(expected);
    }
  );

  async function doExtractVariable(
    code: Code,
    selection: Selection
  ): Promise<{ code: Code; position: Position }> {
    const editor = new InMemoryEditor(code);
    await extractVariable(code, selection, editor);
    return { code: editor.code, position: editor.position };
  }
});
