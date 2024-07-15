document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([15.8700, 100.9925], 6); // พิกัดเริ่มต้นของแผนที่
    var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
    }).addTo(map);

    var damIcon = L.icon({
        iconUrl: 'icon/egg.png', // เปลี่ยนเส้นทางให้เป็นที่อยู่ของไฟล์ PNG ของคุณ
        iconSize: [32, 32], // ขนาดของไอคอน
        iconAnchor: [16, 32], // จุดยึดของไอคอน (จุดที่ไอคอนจะอยู่บนแผนที่)
        popupAnchor: [0, -32] // จุดยึดของ popup ที่จะแสดงเมื่อคลิกไอคอน
    });

    var defaultIcon = L.icon({
        iconUrl: "icon/sunny.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    var rainIcon = L.icon({
        iconUrl: "icon/rainny.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    var defaultLayerGroup = L.layerGroup();
    var rainLayerGroup = L.layerGroup();
    var damLayerGroup = L.layerGroup();
    var forecastLayerGroup = L.layerGroup();


    

    async function fetchDataAndDisplayMarkers() {
        try {
            const response = await fetch("https://leaf-weather.onrender.com/api/weather");
            const data = await response.json();

            data.Stations.Station.forEach((station) => {
                const lat = parseFloat(station.Latitude);
                const lon = parseFloat(station.Longitude);
                const stationName = station.StationNameThai;
                const pressure = parseFloat(station.Observation.MeanSeaLevelPressure);
                const temp = parseFloat(station.Observation.AirTemperature);
                const humidity = parseFloat(station.Observation.RelativeHumidity);
                const rainfall = parseFloat(station.Observation.Rainfall);
                const rainfall24 = parseFloat(station.Observation.Rainfall24Hr);
                const visibility = parseFloat(station.Observation.LandVisibility);
                const windSpeed = parseFloat(station.Observation.WindSpeed);
                const windDirection = parseFloat(station.Observation.WindDirection);

                const icon = rainfall > 1 ? rainIcon : defaultIcon;

                const marker = L.marker([lat, lon], { icon: icon })
                    .bindTooltip(
                        `สถานี: ${stationName}<br>
                        อุณหภูมิ: ${temp}°C<br>
                        ความกด: ${pressure}hPa<br>
                        ความชื้น: ${humidity}%<br>
                        ฝน: ${rainfall} มม.<br>
                        ลม: ${windSpeed} นอต ทิศ: ${windDirection}°<br>
                        ทัศนวิสัย: ${visibility} กม.<br>
                        ฝน24ชม: ${rainfall24} มม.`
                    );

                if (rainfall > 1) {
                    rainLayerGroup.addLayer(marker);
                } else {
                    defaultLayerGroup.addLayer(marker);
                }
            });

            defaultLayerGroup.addTo(map);

            var baseLayers = {
                "OpenStreetMap": osm
            };

            var overlays = {
                "Default Markers": defaultLayerGroup,
                "Rain Markers": rainLayerGroup
            };

            L.control.layers(baseLayers, overlays, {collapsed: false}).addTo(map);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    async function fetchforecastLayer() {
        try {
            const response = await fetch("https://leaf-weather.onrender.com/api/dailyforecast");
            const forecastData = await response.json();

            const regionCoordinates = {
                "ภาคเหนือ": [18.7883, 98.9853], // Chiang Mai
                "ภาคตะวันออกเฉียงเหนือ": [16.4419, 102.8351], // Khon Kaen
                "ภาคกลาง": [13.7563, 100.5018], // Bangkok
                "ภาคตะวันออก": [12.6825, 101.2810], // Rayong
                "ภาคใต้ฝั่งตะวันออก": [9.1382, 99.3215], // Surat Thani
                "ภาคใต้ฝั่งตะวันตก": [7.8804, 98.3923], // Phuket
                "กรุงเทพและปริมณฑล": [13.7563, 100.5018] // Bangkok
            };

            forecastData.DailyForecast.RegionForecast.forEach(region => {
                const coords = regionCoordinates[region.RegionNameThai];
                if (coords) {
                    const marker = L.marker(coords).addTo(map);
                    marker.bindPopup(`<b>${region.RegionNameThai}</b><br>${region.DescriptionThai}`);
                    forecastLayerGroup.addLayer(marker);
                }
            });

            forecastLayerGroup.addTo(map);

            var overlays = {
                "เรดาร์": rainViewerLayer,
                "ข้อมูลสถานี": defaultLayerGroup,
                "สถานีมีฝน": rainLayerGroup,
                "เขื่อน": damLayerGroup,
                "Forecast": forecastLayerGroup
            };

            L.control.layers(null, overlays, {collapsed: false}).addTo(map);

        } catch (error) {
            console.error('Error fetching forecast data:', error);
        }
    }

    async function addRainViewerLayer() {
        try {
            const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data = await response.json();
            const lastUpdated = data.radar.past[data.radar.past.length - 1].time;

            var rainViewerLayer = L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${lastUpdated}/256/{z}/{x}/{y}/4/1_1.png`, {
                opacity: 0.7,
                attribution: 'RainViewer'
            }).addTo(map);

            rainViewerLayer.on('mouseover', function(e) {
                var latLng = e.latlng;
                var popup = L.popup()
                    .setLatLng(latLng)
                    .setContent("Rain data at this point") // Customize with actual data if available
                    .openOn(map);
            });

            var overlays = {
                "เรดาร์": rainViewerLayer,
                "ข้อมูลสถานี": defaultLayerGroup,
                "สถานีมีฝน": rainLayerGroup,
                "เขื่อน": damLayerGroup,
                "พยากรณ์": forecastLayerGroup
            };

            L.control.layers(null, overlays, {collapsed: false}).addTo(map);

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    async function fetchDamData() {
        try {
            // ข้อมูลพิกัดจากไฟล์ JSON
            var damLocations = [
                {"name": "เขื่อนแม่กวงอุดมธารา", "lat": 18.92635191, "long": 99.12558063},
                {"name": "เขื่อนกิ่วลม", "lat": 18.52328449, "long": 99.62495148},
                {"name": "เขื่อนกิ่วคอหมา", "lat": 18.80908013, "long": 99.64306348},
                {"name": "เขื่อนแควน้อยบำรุงแดน", "lat": 17.1894202, "long": 100.4213318},
                {"name": "เขื่อนแม่มอก", "lat": 17.31862932, "long": 99.42379653},
                {"name": "เขื่อนภูมิพล", "lat": 17.24254572, "long": 98.972027},
                {"name": "เขื่อนสิริกิติ์", "lat": 17.76438401, "long": 100.56283052},
                {"name": "เขื่อนแม่งัดสมบูรณ์ชล", "lat": 19.16500778, "long": 99.03468639},
                {"name": "เขื่อนห้วยหลวง", "lat": 18.136485, "long": 99.205765},
                {"name": "เขื่อนน้ำอูน", "lat": 17.30479198, "long": 103.75449902},
                {"name": "เขื่อนลำปาว", "lat": 16.60288973, "long": 103.45051312},
                {"name": "เขื่อนลำตะคอง", "lat": 14.86501304, "long": 101.56034234},
                {"name": "เขื่อนลำพระเพลิง", "lat": 14.59420716, "long": 101.83941175},
                {"name": "เขื่อนมูลบน", "lat": 14.48386067, "long": 102.14750923},
                {"name": "เขื่อนลำแซะ", "lat": 14.42758352, "long": 102.26011455},
                {"name": "เขื่อนลำนางรอง", "lat": 14.30026978, "long": 102.76356518},
                {"name": "เขื่อนน้ำพุง", "lat": 16.97398156, "long": 103.98213947},
                {"name": "เขื่อนจุฬาภรณ์", "lat": 16.53633776, "long": 101.64962984},
                {"name": "เขื่อนอุบลรัตน์", "lat": 16.77455179, "long": 102.61846598},
                {"name": "เขื่อนสิรินธร", "lat": 15.20563299, "long": 105.42852084},
                {"name": "เขื่อนป่าสักชลสิทธิ์", "lat": 14.85346369, "long": 101.08168279},
                {"name": "เขื่อนทับเสลา", "lat": 15.53310462, "long": 99.44719643},
                {"name": "เขื่อนกระเสียว", "lat": 14.83229198, "long": 99.65125187},
                {"name": "เขื่อนศรีนครินทร์", "lat": 14.40890602, "long": 99.12789031},
                {"name": "เขื่อนวชิราลงกรณ์", "lat": 14.799444, "long": 98.596944},
                {"name": "เขื่อนขุนด่านปราการชล", "lat": 14.30747555, "long": 101.32080063},
                {"name": "เขื่อนคลองสียัด", "lat": 13.43970483, "long": 101.65198585},
                {"name": "เขื่อนบางพระ", "lat": 13.21509814, "long": 100.96315393},
                {"name": "เขื่อนหนองปลาไหล", "lat": 12.93038733, "long": 101.28102708},
                {"name": "เขื่อนประแสร์", "lat": 12.97966936, "long": 101.56824372},
                {"name": "เขื่อนนฤบดินทรจินดา", "lat": 14.080838, "long": 102.027308},
                {"name": "เขื่อนปราณบุรี", "lat": 12.46253286, "long": 99.79345577},
                {"name": "เขื่อนแก่งกระจาน", "lat": 12.91645615, "long": 99.62943707},
                {"name": "เขื่อนรัชชประภา", "lat": 8.97253307, "long": 98.80629384},
                {"name": "เขื่อนบางลาง", "lat": 6.15515523, "long": 101.27220744}
            ];

            // ดึงข้อมูลจาก API
            const response = await fetch('https://app.rid.go.th/reservoir/api/dam/public');
            const apiData = await response.json();
            var date = apiData.date; // ดึงวันที่จากข้อมูล API

            // เปรียบเทียบและเพิ่มพิกัดลงในแผนที่ด้วย custom icon
            apiData.data.forEach(region => {
                region.dam.forEach(apiDam => {
                    var matchingDam = damLocations.find(dam => dam.name === apiDam.name);
                    if (matchingDam) {
                        var marker = L.marker([matchingDam.lat, matchingDam.long], {icon: damIcon});
                        damLayerGroup.addLayer(marker);
                        
                        // เมื่อคลิก Marker ให้แสดงข้อมูลในตาราง
                        marker.on('click', function() {
                            var infoTable = document.getElementById('info-table');
                            var tableBody = document.getElementById('table-body');
                            tableBody.innerHTML = ''; // ล้างข้อมูลเดิม

                            var row = '';
                            row += '<tr><td>เจ้าของเขื่อน</td><td>' + (apiDam.owner || 'N/A') + '</td></tr>';
                            row += '<tr><td>ปริมาณน้ำสูงสุด (ล้าน ลบ.ม.)</td><td>' + (apiDam.capacity || 'N/A') + '</td></tr>';
                            row += '<tr><td>ปริมาณน้ำเก็บกัก (ล้าน ลบ.ม.)</td><td>' + (apiDam.storage || 'N/A') + '</td></tr>';
                            row += '<tr><td>ปริมาณน้ำใช้การ (ล้าน ลบ.ม.)</td><td>' + (apiDam.active_storage || 'N/A') + '</td></tr>';
                            row += '<tr><td>ปริมาณใช้การต่ำสุด (ล้าน ลบ.ม.)</td><td>' + (apiDam.dead_storage || 'N/A') + '</td></tr>';
                            row += '<tr><td>ปริมาณน้ำในเขื่อน (ล้าน ลบ.ม.)</td><td>' + (apiDam.volume || 'N/A') + '</td></tr>';
                            row += '<tr><td>ปริมาณกักเก็บ (%)</td><td>' + (apiDam.percent_storage !== null ? apiDam.percent_storage + '%' : 'N/A') + '</td></tr>';
                            row += '<tr><td>ปริมาณน้ำไหลเข้าเขื่อน (ล้าน ลบ.ม.)</td><td>' + (apiDam.inflow !== null ? apiDam.inflow : 'N/A') + '</td></tr>';
                            row += '<tr><td>ปริมาณน้ำระบาย (ล้าน ลบ.ม.)</td><td>' + (apiDam.outflow !== null ? apiDam.outflow : 'N/A') + '</td></tr>';
                            tableBody.innerHTML = row;
                            infoTable.style.display = 'block'; // แสดง info-table
                        });
                    }
                });
            });
        } catch (error) {
            console.error('Error fetching dam data:', error);
        }
    }

    addRainViewerLayer();
    fetchDataAndDisplayMarkers();
    fetchDamData();
    fetchforecastLayer();
});
