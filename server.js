const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());  // ใช้ cors เพื่ออนุญาตการเข้าถึงจากทุกโดเมน

app.get('/api/weather', async (req, res) => {
    try {
        const response = await fetch('https://radarkhonkaen.com/json/api.php');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.get('/api/dailyforecast', async (req, res) => {
    try {
        const response = await fetch('https://data.tmd.go.th/api/DailyForecast/v2/?uid=u63varodom2011&ukey=4e24bb2b6db8caf2e9ce637ec9d9a815&format=json');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.get('/api/rainfall', async (req, res) => {
    try {
        const response = await fetch('https://data.tmd.go.th/api/thailandMonthlyRainfall/v1/?uid=u63varodom2011&ukey=4e24bb2b6db8caf2e9ce637ec9d9a815&format=json');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.get('/api/temp', async (req, res) => {
    try {
        const response = await fetch('https://radarkhonkaen.com/canvas/API/');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
