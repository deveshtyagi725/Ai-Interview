const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")



async function authUser(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    let isTokenBlacklisted = false;
    if (typeof global.dbConnected !== 'undefined' && global.dbConnected) {
        try {
            const isTokenBlacklistedRes = await tokenBlacklistModel.findOne({
                token
            })
            isTokenBlacklisted = !!isTokenBlacklistedRes;
        } catch (err) {
            console.log("Blacklist check failed:", err.message);
        }
    }

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()

    } catch (err) {

        return res.status(401).json({
            message: "Invalid token."
        })
    }

}


module.exports = { authUser }