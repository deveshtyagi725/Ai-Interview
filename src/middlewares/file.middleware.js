const multer = require("multer")

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true)
    } else {
        cb(new Error('Only PDF files are allowed'), false)
    }
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB to match UI
    },
    fileFilter
})

module.exports = upload
