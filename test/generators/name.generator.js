function nameGenerator(type){
  const isNamed = Math.random() < 0.5
  return isNamed ? `${type} #${Math.floor(Math.random()*1000)}` : ''
}

module.exports = nameGenerator