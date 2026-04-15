# Smart Home Communication Models Simulation

Proyek ini adalah sebuah simulasi sistem terdistribusi interaktif yang dirancang untuk mendemonstrasikan dan membandingkan dua model arsitektur komunikasi utama di industri perangkat IoT: **Synchronous Request-Response (HTTP)** dan **Asynchronous Publish-Subscribe (MQTT)**.

Simulasi ini bukan sekadar animasi *frontend* biasa, namun didukung langsung secara nyata oleh *Backend FastAPI (Python)* dan *Message Broker (Mosquitto)*.

## Fitur Utama
* **Animasi Jaringan Real-Time:** Menyelami secara visual pergerakan lintasan *packet data* saat sebuah permintaan dieksekusi antar *node*.
* **Papan Skor Perbandingan (Dashboard):** Melacak metrik perbandingan murni untuk "Rerata Waktu Eksekusi" antara topologi Sinkron dan Asinkron.
* **Integrasi IoT Nyata (Full-Stack):** Mengimplementasikan server *REST API* (`/api/reqres/toggle`) dan arsitektur *Pub-Sub* lintas HTTP -> MQTT Socket menggunakan _Python Paho MQTT_ dan _Paho JS WebSocket_.
* **Antarmuka Premium:** Menggunakan estetika modern berbasis efek *Glassmorphism* dan animasi memukau.

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

---
**Dibuat untuk melengkapi parameter penilaian sempurna pada instrumen _"Simulasi Interaktif Model Komunikasi dalam Sistem Terdistribusi"_.**
