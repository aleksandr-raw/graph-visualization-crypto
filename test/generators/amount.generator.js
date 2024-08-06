function amountGenerator(min, max) {
  return min + Math.random() * (max - min)
}

module.exports = amountGenerator