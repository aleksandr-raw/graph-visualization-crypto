const amountGenerator = require("./amount.generator")

const tokenMap = {
  'ETH': 2000,
  'USDT': 1,
  'SHIB': 0.00002,
  'FLOKI': 0.00018,
  'ZK': 0.15938,
}

function tokensGenerator(){
  const tokens = []
  Object.keys(tokenMap).forEach(token => {
    const add = Math.random() < 0.5
    if(!add) return
    const amount = amountGenerator(1 / tokenMap[token], 1000 / tokenMap[token])
    tokens.push({
      name: token,
      amount: amount,
      usdt_amount: amount*tokenMap[token],
    })
  })
  return tokens
}

module.exports = tokensGenerator