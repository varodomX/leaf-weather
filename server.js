const express = require("express");
const axios = require("axios");
const mysql = require("mysql2");
const cors = require("cors");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // เปิดให้ API รองรับทุกโดเมน
app.use(express.json()); // รองรับ JSON payload

// ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: "103.86.51.224",
  user: "varodomc_online",
  password: "varodom2011",
  database: "varodomc_online",
});

// เชื่อมต่อฐานข้อมูล
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL database");
});

// 🔹 API ดึงข้อมูลสภาพอากาศจาก radarkhonkaen.com
app.get("/api/weather", async (req, res) => {
  try {
    const response = await axios.get("https://radarkhonkaen.com/json/api.php");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// 🔹 API ดึงข้อมูลพยากรณ์อากาศรายวันจาก TMD
app.get("/api/dailyforecast", async (req, res) => {
  try {
    const response = await axios.get(
      "https://data.tmd.go.th/api/DailyForecast/v2/?uid=u63varodom2011&ukey=4e24bb2b6db8caf2e9ce637ec9d9a815&format=json"
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch daily forecast" });
  }
});

// 🔹 API ดึงข้อมูลปริมาณน้ำฝนรายเดือนจาก TMD
app.get("/api/rainfall", async (req, res) => {
  try {
    const response = await axios.get(
      "https://data.tmd.go.th/api/thailandMonthlyRainfall/v1/?uid=u63varodom2011&ukey=4e24bb2b6db8caf2e9ce637ec9d9a815&format=json"
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rainfall data" });
  }
});

// 🔹 API ดึงข้อมูลอุณหภูมิจาก radarkhonkaen.com
app.get("/api/temp", async (req, res) => {
  try {
    const response = await axios.get("https://radarkhonkaen.com/canvas/API/");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch temperature data" });
  }
});

// 🔹 ฟังก์ชันดึงข้อมูลจาก API และบันทึกลง MySQL
async function fetchAndStoreWeatherData() {
  try {
    const response = await axios.get(
      "https://data.tmd.go.th/api/DailyForecast/v2/?uid=u63varodom2011&ukey=4e24bb2b6db8caf2e9ce637ec9d9a815&format=json"
    );
    const data = response.data;

    if (!data || !data.WeatherForecast) {
      console.error("❌ API response is invalid.");
      return;
    }

    const weatherRecords = data.WeatherForecast;

    // ลบข้อมูลเก่าในตาราง weather
    db.query("DELETE FROM weather", (err) => {
      if (err) {
        console.error("❌ Error clearing weather data:", err);
        return;
      }
      console.log("✅ ลบข้อมูลเก่าเรียบร้อย");
    });

    // วนลูปบันทึกข้อมูลใหม่ลงฐานข้อมูล
    weatherRecords.forEach((record) => {
      const {
        Province,
        MaxTemperature,
        MinTemperature,
        RelativeHumidity,
        WindSpeed,
        DateTime,
      } = record;

      const sql =
        "INSERT INTO weather (province, max, min, humidity, wind_speed, date_time) VALUES (?, ?, ?, ?, ?, ?)";
      const values = [
        Province,
        MaxTemperature,
        MinTemperature,
        RelativeHumidity,
        WindSpeed,
        DateTime,
      ];

      db.query(sql, values, (err) => {
        if (err) {
          console.error("❌ Error inserting weather data:", err);
          return;
        }
      });
    });

    console.log("✅ อัปเดตข้อมูลสภาพอากาศลงฐานข้อมูลเรียบร้อยแล้ว!");
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูล:", error.message);
  }
}

// 🔹 ตั้งเวลาให้รันทุก 6 ชั่วโมง (0 น., 6 น., 12 น., 18 น.)
cron.schedule("0 */6 * * *", () => {
  console.log("⏳ กำลังอัปเดตข้อมูลสภาพอากาศ...");
  fetchAndStoreWeatherData();
});

// 🔹 API ดึงข้อมูลจาก MySQL แทน JSON
app.get("/api/weatherdb", (req, res) => {
  db.query("SELECT * FROM weather ORDER BY date_time DESC", (err, results) => {
    if (err) {
      return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลจากฐานข้อมูล" });
    }
    res.json(results);
  });
});

// 🔹 เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  fetchAndStoreWeatherData(); // ดึงข้อมูลทันทีเมื่อเริ่มระบบ
});
