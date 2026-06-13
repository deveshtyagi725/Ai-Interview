const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

const isProd = process.env.NODE_ENV === "production"
const cookieOptions = { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax" }

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    if (typeof global.dbConnected !== 'undefined' && !global.dbConnected) {
        return res.status(503).json({ message: "Database unavailable. Please try later." });
    }
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [ { username }, { email } ]
        })

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username,
            email,
            password: hash
        })

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        res.cookie("token", token, cookieOptions)

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("Register error:", err);
        res.status(503).json({ message: "Database error. Registration temporarily unavailable." });
    }
}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
    if (typeof global.dbConnected !== 'undefined' && !global.dbConnected) {
        return res.status(503).json({ message: "Database unavailable. Please try later." });
    }
    try {
        const { email, password } = req.body

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        res.cookie("token", token, cookieOptions)
        res.status(200).json({
            message: "User loggedIn successfully.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("Login error:", err);
        res.status(503).json({ message: "Database error. Login temporarily unavailable." });
    }
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token && typeof global.dbConnected !== 'undefined' && global.dbConnected) {
        try {
            await tokenBlacklistModel.create({ token })
        } catch (err) {
            console.log("Blacklist add failed:", err.message);
        }
    }

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {
    if (typeof global.dbConnected !== 'undefined' && !global.dbConnected) {
        return res.status(503).json({ message: "Database unavailable." });
    }
    try {
        const user = await userModel.findById(req.user.id)

        res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("Get me error:", err);
        res.status(503).json({ message: "Database error." });
    }
}



module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}