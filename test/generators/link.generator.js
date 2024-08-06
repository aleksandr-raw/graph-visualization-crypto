const tokensGenerator = require("./tokens.generator.")

function linkGenerator(sender, receiver){
  const tokens = tokensGenerator()
  return {
    id: `${sender}${receiver}`,
    sender: sender,
    receiver: receiver,
    usdt_amount: tokens.reduce((p, c) => p + c.usdt_amount, 0),
    tokens_amount: tokens,
  }
}

module.exports = linkGenerator