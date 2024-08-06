const hashGenerator = require("../generators/hash.generator")
const linkGenerator = require("../generators/link.generator")
const nodeGenerator = require("../generators/node.generator")
const addressRegex = /0x[0-9A-F]{4}/
const messagesMap = new Map()
const nodeMap = new Map()
const linkMap = new Map()

function messagesController(req, res, next) {
  const address = req.body.address
  if (!address) {
    res.status(500).json({
      code: 500,
      message: "Request body must contain address"
    })
    return
  }
  if(!addressRegex.test(address)){
    res.status(500).json({
      code: 500,
      message: "Unknown address"
    })
    return
  }
  if (messagesMap.has(address)) {
    res.status(200).json(messagesMap.get(address))
    return
  }

  const targetNode = nodeMap.get(address) ?? nodeGenerator(address)
  if (!nodeMap.has(address)) nodeMap.set(address, targetNode)
  if (!linkMap.has(address)) linkMap.set(address, [])

  const newCounterparties = Math.floor(Math.random() * 20)
  for (let i = 0; i < newCounterparties; i++) {
    const hash = hashGenerator()
    if (nodeMap.has(hash)) continue
    const node = nodeGenerator(hash)
    const isSender = Math.random() < 0.5
    const isReceiver = Math.random() < 0.5
    const links = []
    if (isSender) links.push(linkGenerator(node.id, address))
    if (isReceiver) links.push(linkGenerator(address, node.id))

    nodeMap.set(node.id, node)
    if (!linkMap.has(node.id)) linkMap.set(node.id, [])
    linkMap.get(node.id).push(...links)
    linkMap.get(address).push(...links)
  }

  const links = linkMap.get(address)
  const nodes = links.map(l => l.sender == address ? l.receiver : l.sender)
    .filter((v, i, self) => self.indexOf(v) == i && nodeMap.has(v))
    .map(id => nodeMap.get(id))

  const message = {
    nodes: [targetNode, ...nodes],
    links: [...links]
  }

  messagesMap.set(address, message)

  res.status(200).json(message)
}

module.exports = messagesController