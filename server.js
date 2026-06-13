require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")

connectToDB().catch(err => {
  console.log("DB init failed, continuing without DB:", err.message)
})

app.get("/", (req, res) => {
  res.json({ message: "Backend is live and healthy!" })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))

module.exports = app
