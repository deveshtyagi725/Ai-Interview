const mongoose = require("mongoose")



async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to Database")
        global.dbConnected = true;
        return;
    } catch (err) {
        console.log("DB Connection failed:", err.message);
        global.dbConnected = false;
        return;
    }
}

module.exports = connectToDB