const types = [
  'user',
  'cex',
  'bridge'
]

function typeGenerator(){
  return types[Math.floor(Math.random()*types.length)]
}

module.exports = typeGenerator