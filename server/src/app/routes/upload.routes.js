const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

// הבטחה שהתיקייה קיימת כדי ש-multer לא יקרוס
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// הגדרת אחסון Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // הוספת Timestamp כדי למנוע התנגשויות שמות
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // הגבלת גודל 5MB
});

/**
 * @route POST /api/upload
 * @desc העלאת קובץ תמונה ומחזיר קישור אליו
 * @access Private
 */
router.post("/", authMiddleware, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: { message: "לא נבחר קובץ" } });
    }

    // מחזירים את הנתיב הסטטי היחסי (לדוגמה: /uploads/123456789.jpg)
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
});

module.exports = router;
