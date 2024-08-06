const express = require("express");
const bodyParser = require("body-parser")
const cors = require('cors')

const messagesRouter = require("./routes/messages")
// создаем объект приложения
const app = express();
// определяем обработчик для маршрута "/"
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
// начинаем прослушивать подключения на 3000 порту
app.use("/messages", messagesRouter)

app.listen(3000);