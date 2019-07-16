export { RefactoringCommand };

// String values must match `command` fields in `package.json`
enum RefactoringCommand {
  RenameSymbol = "abracadabra.renameSymbol",
  NegateExpression = "abracadabra.negateExpression",
  RemoveRedundantElse = "abracadabra.removeRedundantElse",
  MoveStatementUp = "abracadabra.moveStatementUp"
}
