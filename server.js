const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const app = express();

// Middleware-lər
app.use(cors());
app.use(express.json());

// PostgreSQL bağlantısı
const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "cfr_elan",
    password: process.env.DB_PASSWORD || "12345",
    port: process.env.DB_PORT || 5432
});

// Baza bağlantısında gözlənilməz xətanı tutmaq üçün
pool.on("error", (err) => {
    console.error("Gözlənilməz baza xətası:", err);
});

// Test marşrutu
app.get("/", (req, res) => {
    res.json({ status: "Server aktivdir və işləyir!" });
});

// ==========================================
// 1. QEYDİYYAT (SIGN UP)
// ==========================================
app.post("/signup", async (req, res) => {
    let { fullname, email, password } = req.body;

    // Xanaların boş olub-olmaması yoxlanılır
    if (!fullname || !email || !password) {
        return res.status(400).json({ message: "Zəhmət olmasa, bütün xanaları doldurun!" });
    }

    fullname = fullname.trim();
    email = email.trim().toLowerCase();

    // Şifrənin minimum uzunluğu
    if (password.length < 8) {
        return res.status(400).json({ message: "Şifrə ən azı 8 simvoldan ibarət olmalıdır!" });
    }

    try {
        // Email-in əvvəlcədən mövcud olub-olmadığını yoxlayırıq
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1", 
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "Bu email artıq qeydiyyatdan keçib!" });
        }

        // Şifrəni şifrələyirik (hashing)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Yeni istifadəçini bazaya əlavə edirik
        const newUser = await pool.query(
            "INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3) RETURNING id, fullname, email",
            [fullname, email, hashedPassword]
        );

        res.status(201).json({ 
            message: "Qeydiyyat uğurla tamamlandı!",
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error("Signup xətası:", err);
        res.status(500).json({ message: "Serverdə xəta baş verdi, yenidən cəhd edin." });
    }
});

// ==========================================
// 2. DAXİL OLMAQ (LOGIN)
// ==========================================
app.post("/login", async (req, res) => {
    let { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email və şifrə daxil edilməlidir!" });
    }

    email = email.trim().toLowerCase();

    try {
        // İstifadəçini axtarırıq
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Bu email ilə qeydiyyatlı istifadəçi tapılmadı!" });
        }

        const user = result.rows[0];

        // Şifrənin doğruluğunu yoxlayırıq
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Daxil edilən şifrə yanlışdır!" });
        }

        // Frontend üçün istifadəçi məlumatları (şifrə xaric)
        res.status(200).json({
            message: "Uğurla daxil oldunuz!",
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email
            }
        });

    } catch (err) {
        console.error("Login xətası:", err);
        res.status(500).json({ message: "Daxil olarkən server xətası baş verdi." });
    }
});

// ==========================================
// 3. YENİ ELAN ƏLAVƏ ETMƏK (POST AD)
// ==========================================
app.post("/ads", async (req, res) => {
    const { title, description, price, user_id } = req.body;

    // Sahələrin yoxlanışı
    if (!title || !price || !user_id) {
        return res.status(400).json({ message: "Başlıq, qiymət və istifadəçi ID mütləqdir!" });
    }

    if (isNaN(price) || Number(price) <= 0) {
        return res.status(400).json({ message: "Qiymət düzgün rəqəm olmalıdır!" });
    }

    try {
        const newAd = await pool.query(
            "INSERT INTO ads (title, description, price, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [title.trim(), description ? description.trim() : null, price, user_id]
        );

        res.status(201).json({ 
            message: "Elan uğurla əlavə edildi!",
            ad: newAd.rows[0]
        });

    } catch (err) {
        console.error("Elan əlavə xətası:", err);
        res.status(500).json({ message: "Elan əlavə edilərkən xəta baş verdi." });
    }
});

// ==========================================
// 4. BÜTÜN ELANLARI GƏTİRMƏK (GET ADS)
// ==========================================
app.get("/ads", async (req, res) => {
    try {
        // JOIN vasitəsilə elanın sahibinin adını və emailini də birlikdə gətiririk
        const query = `
            SELECT 
                ads.id,
                ads.title,
                ads.description,
                ads.price,
                ads.user_id,
                users.fullname AS author_name,
                users.email AS author_email
            FROM ads
            LEFT JOIN users ON ads.user_id = users.id
            ORDER BY ads.id DESC
        `;

        const result = await pool.query(query);
        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Elanlar gətirilərkən xəta:", err);
        res.status(500).json({ message: "Elanlar gətirilə bilmədi." });
    }
});

// ==========================================
// SERVERİ BAŞLATMAQ
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server http://localhost:${PORT} ünvanında işləyir`);
});
