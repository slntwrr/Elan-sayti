const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// postgresql baglantisi
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "cfr_elan",
    password: "12345",
    port: 5432
});

// test
app.get("/", (req, res) => {
    res.send("Server işləyir");
});

// sign up
app.post("/signup", async (req, res) => {
    const { fullname, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3)",
            [fullname, email, hashedPassword]
        );

        res.json({ message: "Qeydiyyat uğurludur" });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Email artıq mövcuddur və ya xəta baş verdi" });
    }
});

// login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "İstifadəçi tapılmadı" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Şifrə yanlışdır" });
        }

        res.json({ message: "Uğurla daxil oldunuz" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server xətası" });
    }
});

// elan elave et
app.post("/ads", async (req, res) => {
    const { title, description, price, user_id } = req.body;

    try {
        await pool.query(
            "INSERT INTO ads (title, description, price, user_id) VALUES ($1, $2, $3, $4)",
            [title, description, price, user_id]
        );

        res.json({ message: "Elan əlavə edildi!" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Xəta baş verdi" });
    }
});

// elanlari goster
app.get("/ads", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM ads ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Elanlar gətirilə bilmədi" });
    }
});

// SERVER START
app.listen(3000, () => {
    console.log("Server 3000 portunda işləyir");
});
