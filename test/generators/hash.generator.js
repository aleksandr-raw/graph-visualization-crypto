function hashGenerator(){
  const hash = Math.floor(Math.random()*65536).toString(16).toUpperCase()
  return '0x' + '0'.repeat(4-hash.length) + hash
}

module.exports = hashGenerator