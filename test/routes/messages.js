const express = require("express");
const messagesController = require("../controllers/messages.controller")

const router = express.Router();

router.post('/', messagesController)

module.exports = router
