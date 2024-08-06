const amountGenerator = require("./amount.generator");
const nameGenerator = require("./name.generator");
const tokensGenerator = require("./tokens.generator.");
const typeGenerator = require("./type.generator");

function nodeGenerator(hash) {
  const type = typeGenerator()
  const name = nameGenerator(type)
  const tokens = tokensGenerator()
  return {
    id: hash,
    type: type,
    name: name,
    usdt_balance: tokens.reduce((p, c) => p + c.usdt_amount, 0),
    tokens: tokens
  }
}

module.exports = nodeGenerator