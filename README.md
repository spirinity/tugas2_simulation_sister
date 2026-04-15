# Smart Home Communication Models Simulation

Proyek ini adalah sebuah simulasi sistem terdistribusi interaktif yang dirancang untuk mendemonstrasikan dan membandingkan dua model arsitektur komunikasi utama di industri perangkat IoT: **Synchronous Request-Response (HTTP)** dan **Asynchronous Publish-Subscribe (MQTT)**.

## Penjelasan Model Komunikasi

### 1. Request-Response (Smart Lighting Control)
Mensimulasikan komunikasi **sinkron 1-to-1** antara klien (Aplikasi HP) dengan Server API. 
* **Skenario:** Pengguna mengirimkan perintah spesifik untuk menyalakan/mematikan lampu pintar.
* **Cara Kerja:** Klien (*Mobile App*) mengirim instruksi ke API Server. Sistem klien akan terkunci (menunggu secara sinkron) hingga API Server selesai memproses perintah pada perangkat lampu dan mengembalikan kepastian status keberhasilan (*Response*).

### 2. Publish-Subscribe (Sistem Tanggap Darurat Bencana)
Mensimulasikan komunikasi **asinkron 1-to-Many** menggunakan protokol MQTT via Mosquitto Broker.
* **Skenario:** *Smoke Sensor* (Sensor Asap) mendeteksi bahaya dan secara otomatis melepaskan sinyal kewaspadaan ke seluruh ekosistem rumah pintar.
* **Cara Kerja:** Sensor bertindak sebagai *Publisher* yang mengirimkan "event peringatan darurat" ke *Message Broker*. Broker seketika menembakkan instruksi darurat ini ke ratusan/ribuan *Subscriber* (seperti Sistem Alarm, *Sprinkler/Pemadam*, dan Notifikasi HP) di saat bersamaan. Arsitekturnya kuat, *loosely coupled*, efisien, dan cocok untuk perangkat IoT massal tanpa membuat server kewalahan karena lonjakan balasan pesan tunggal (`Response`).

---

## Persyaratan Sistem
Sebelum menjalankan proyek ini, pastikan mesin Anda telah terpasang:
1. **Python 3.8+**
2. **Eclipse Mosquitto (Message Broker)**
   * (Di Windows, posisikan folder instalasi agar dapat dipanggil via command prompt/powershell).

## Tahap Instalasi

Instal semua *library* (dependensi) Python yang dibutuhkan dengan menjalankan perintah berikut di terminal:
```bash
pip install fastapi[all] pydantic paho-mqtt
```

---

## Cara Menjalankan Proyek (How to Run)

Karena simulasi ini memuat ekosistem server terdistribusi, Anda diwajibkan untuk menjalankan 2 layanan (Broker & API Server) sebelum membuka halamannya.

### Langkah 1: Jalankan Message Broker (Mosquitto)
Buka terminal baru di direktori proyek, lalu eksekusi konfigurasi lokal Mosquitto yang telah disempurnakan :
```powershell
& "C:\Path\To\Mosquitto\mosquitto.exe" -c mosquitto.conf
```
*(Ganti path executablenya sesuai lokasi di PC Anda. Jangan ditutup! Biarkan berjalan di latar belakang).*

### Langkah 2: Jalankan API Server & Web Server (FastAPI)
Buka tab terminal baru (biarkan terminal Mosquitto tadi hidup), dan jalankan *Backend Server* Python:
```bash
uvicorn main:app
```

### Langkah 3: Buka Simulasi
Buka *browser* (direkomendasikan Google Chrome/Edge) dan akses URL lokal server:
**[http://localhost:8000](http://localhost:8000)**

---

## Arsitektur Jaringan (Port Guide)
Proyek ini mengadopsi standar sistem terdistribusi modern di mana setiap titik komunikasi mendengarkan lalu lintas pada jalur/port tersendiri:
* **Port `8000`**: Dieksekusi oleh Uvicorn (FastAPI) untuk melayani file Web Tampilan HTML/CSS/JS dan interaksi `HTTP POST API`.
* **Port `1884`**: Port internal MQTT TCP untuk komunikasi pertukaran instruksi darurat dari FastAPI Server (*Publisher*) ke Mosquitto *Broker*.
* **Port `9001`**: Port Websockets MQTT yang digunakan *Mobile Client* (Browser Chrome/JS) saat berlangganan (*Subscribe*) ke Broker secara Asinkron, memintas larangan protokol TCP langsung dari halaman Web.

## Struktur Direktori
* `index.html` — Kanvas anatomi sistem dan *Dashboard* (Frontend). 
* `style.css` — Penyusun kerangka estetik kaca premium (Glassmorphism).
* `script.js` — Logika *Promise-based* untuk animasi transmisi, kalkulasi skor rekor eksekusi komparatif, dan mesin *Client WebSocket MQTT*.
* `main.py` — Logika *RESTful Handler* (Uvicorn) dan *Publisher Background Looping*.
* `mosquitto.conf` — Instruksi porting anonim lokal agar *Browser* diizinkan terkoneksi ria ke broker kita secara lokal.
