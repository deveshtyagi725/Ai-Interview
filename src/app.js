const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
const allowedOrigins = ["https://ai-frontend-snowy.vercel.app", "http://localhost:5173"]
const corsOptions = {
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}
app.use(cors(corsOptions))
app.options("/*path", cors(corsOptions))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app