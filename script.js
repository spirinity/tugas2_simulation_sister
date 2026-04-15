// DOM Elements
const latencySlider = document.getElementById('latencySlider');
const latencyValue = document.getElementById('latencyValue');

const tabBtns = document.querySelectorAll('.tab-btn');
const simViews = document.querySelectorAll('.sim-view');

const metricMsgs = document.getElementById('metric-msgs');
const metricTime = document.getElementById('metric-time');
const simStatus = document.getElementById('sim-status');
const logContainer = document.getElementById('logContainer');
const packetLayer = document.getElementById('packetLayer');

// Nodes Req-Res
const btnToggleLight = document.getElementById('btnToggleLight');
const reqPhone = document.getElementById('req-phone');
const reqHub = document.getElementById('req-hub');
const reqLight = document.getElementById('req-light');
const lightIcon = reqLight.querySelector('.light-icon');

// Nodes Pub-Sub
const btnTriggerFire = document.getElementById('btnTriggerFire');
const pubSensor = document.getElementById('pub-sensor');
const pubBroker = document.getElementById('pub-broker');
const subAlarm = document.getElementById('sub-alarm');
const subSprinkler = document.getElementById('sub-sprinkler');
const subPhone = document.getElementById('sub-phone');
const subNotification = document.getElementById('sub-notification');

// State
let networkLatency = 800;
let totalMessages = 0;
let isSimulationRunning = false;

// Helpers
const formatTime = () => {
    const d = new Date();
    return `[${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}]`;
};

const addLog = (message) => {
    const entry = document.createElement('div');
    entry.className = `log-row event`;
    entry.textContent = `${formatTime()} ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
};

const updateMetrics = () => {
    totalMessages++;
    metricMsgs.textContent = totalMessages;
};

const setStatus = (text, color = "var(--text-second)") => {
    simStatus.textContent = text;
    simStatus.style.color = color;
};

// Listeners
latencySlider.addEventListener('input', (e) => {
    networkLatency = parseInt(e.target.value);
    latencyValue.textContent = networkLatency;
});

// Tab Switcher
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isSimulationRunning) return; // Prevent switching mid-animation
        
        tabBtns.forEach(b => b.classList.remove('active'));
        simViews.forEach(v => v.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
        
        setStatus('Idle');
    });
});

// ANIMATION ENGINE
const sendPacket = (sourceEl, targetEl, packetClass, duration) => {
    return new Promise((resolve) => {
        const packet = document.createElement('div');
        packet.className = `packet ${packetClass}`;
        packetLayer.appendChild(packet);
        
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const startX = sourceRect.left + sourceRect.width / 2;
        const startY = sourceRect.top + sourceRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        packet.style.left = `${startX}px`;
        packet.style.top = `${startY}px`;
        
        packet.getBoundingClientRect(); // force reflow
        
        packet.style.transition = `all ${duration}ms linear`;
        packet.style.left = `${endX}px`;
        packet.style.top = `${endY}px`;
        
        targetEl.classList.add('active-pulse');

        setTimeout(() => {
            packet.remove();
            targetEl.classList.remove('active-pulse');
            updateMetrics();
            resolve();
        }, duration);
    });
};

/* =======================================================
   1. REQUEST - RESPONSE KONTROL (HTTP FETCH)
   ======================================================= */
let isLightOn = false;

btnToggleLight.addEventListener('click', async () => {
    if (isSimulationRunning) return;
    isSimulationRunning = true;
    
    // Lock UI
    metricTime.textContent = "Processing...";
    btnToggleLight.disabled = true;
    btnToggleLight.textContent = "Processing...";
    btnToggleLight.style.opacity = "0.5";
    setStatus('Req-Res Running', 'var(--accent)');
    
    const t0 = performance.now();
    addLog(`[Client] Mengirim HTTP POST request ke FastAPI Hub...`);
    
    // Path: Phone -> Hub (Animasi Request berjalan sembari fetch JSON)
    await sendPacket(reqPhone, reqHub, 'req', networkLatency);
    
    try {
        // HTTP REQUEST SEBENARNYA KE BACKEND PYTHON
        const response = await fetch('/api/reqres/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isLightOn: isLightOn })
        });
        
        const data = await response.json();
        
        if(data.status === 'success') {
            addLog(`[Server] Status dari backend: ${data.state}, Meneruskan instruksi ke Lampu...`);
            
            // Path: Hub -> Light (Animation)
            await sendPacket(reqHub, reqLight, 'req', networkLatency);
            
            // Ubah status UI secara presisi sesuai balasan Database/Server
            isLightOn = data.isLightOn;
            if(isLightOn) {
                lightIcon.classList.add('on');
                btnToggleLight.classList.add('active');
            } else {
                lightIcon.classList.remove('on');
                btnToggleLight.classList.remove('active');
            }
            
            addLog(`[Light] Status perangkat berubah. Mengembalikan response 200 OK...`);
            
            // Path: Light -> Hub (Animation)
            await sendPacket(reqLight, reqHub, 'res', networkLatency);
            addLog(`[Server] Meneruskan balasan JSON ke Phone Client...`);
            
            // Path: Hub -> Phone (Animation)
            await sendPacket(reqHub, reqPhone, 'res', networkLatency);

            btnToggleLight.textContent = isLightOn ? "Switch OFF" : "Switch ON";
        }
    } catch (error) {
        console.error(error);
        addLog(`[Error] Koneksi HTTP ke backend FastAPI gagal! Detail: ${error.message}`);
        btnToggleLight.textContent = "Error!";
    }
    
    // Unlock UI
    btnToggleLight.disabled = false;
    btnToggleLight.style.opacity = "1";
    setStatus('Idle');
    const t1 = performance.now();
    metricTime.textContent = `${(t1 - t0).toFixed(0)} ms`;
    addLog(`[Client] Interaksi Request-Response selesai dalam ${(t1 - t0).toFixed(0)} ms.`);
    
    isSimulationRunning = false;
});

/* =======================================================
   2. PUBLISH - SUBSCRIBE KONTROL (MQTT WEBSOCKETS)
   ======================================================= */

// MQTT Client Setup via Paho
const mqttBroker = window.location.hostname || "localhost";
const mqttPort = 9001; 
const mqttTopic = "smarthome/alert";
const clientId = "browser_client_" + parseInt(Math.random() * 1000, 10);

const mqttClient = new Paho.MQTT.Client(mqttBroker, mqttPort, "/mqtt", clientId);

mqttClient.onConnectionLost = (responseObject) => {
    if (responseObject.errorCode !== 0) {
        addLog(`[MQTT Error] Koneksi broker terputus: ${responseObject.errorMessage}`);
    }
};

// ==========================================
// KETIKA PESAN TIBA DARI MESSAGE BROKER
// ==========================================
mqttClient.onMessageArrived = async (message) => {
    addLog(`[Subscriber] Browser menerima event ASINKRON via MQTT! Payload: "${message.payloadString}"`);
    
    // Animasi Distribusi dari Broker ke 3 Nodes HANYA terjadi jikalau ada pesan MQTT sungguhan
    const p1 = sendPacket(pubBroker, subAlarm, 'sub', networkLatency).then(() => {
        subAlarm.querySelector('.icon').textContent = "🚨🔔";
        addLog(`[Alarm] Bereaksi menyalakan bunyi sirine.`);
    });
    
    const p2 = sendPacket(pubBroker, subSprinkler, 'sub', networkLatency).then(() => {
        subSprinkler.querySelector('.icon').textContent = "🚿💦";
        addLog(`[Sprinkler] Pompa air otomatis diaktifkan.`);
    });
    
    const p3 = sendPacket(pubBroker, subPhone, 'sub', networkLatency).then(() => {
        subNotification.classList.add('show');
        addLog(`[Client App] Menerima push notification bahaya.`);
    });
    
    await Promise.all([p1, p2, p3]);
    
    const t1 = performance.now();
    metricTime.textContent = `${(t1 - window.pubsubStartTime).toFixed(0)} ms`;
    addLog(`[System] Flow MQTT Pub/Sub asinkron selesai diproses dalam ${(t1 - window.pubsubStartTime).toFixed(0)} ms.`);
    setStatus('Resetting...');
    
    // Reset status node untuk pemakaian berikutnya
    setTimeout(() => {
        subAlarm.querySelector('.icon').textContent = "🚨";
        subSprinkler.querySelector('.icon').textContent = "🚿";
        subNotification.classList.remove('show');
        btnTriggerFire.disabled = false;
        setStatus('Idle');
        isSimulationRunning = false;
    }, 3000);
};

// Inisialisasi Koneksi Browser ke MQTT
mqttClient.connect({
    onSuccess: () => {
        addLog(`[MQTT Client] Terkoneksi ke Broker MQTT ws://${mqttBroker}:${mqttPort}`);
        mqttClient.subscribe(mqttTopic);
        addLog(`[MQTT Client] Berlangganan (Subscribed) ke topik: ${mqttTopic}`);
    },
    onFailure: (e) => {
        addLog(`[MQTT Error] Gagal merapat ke broker: ${e.errorMessage}. Peringatan: Pastikan Mosquitto di port 9001 (WebSockets) telah menyala.`);
    }
});

btnTriggerFire.addEventListener('click', async () => {
    if (isSimulationRunning) return;
    isSimulationRunning = true;
    
    metricTime.textContent = "Processing...";
    btnTriggerFire.disabled = true;
    setStatus('Pub-Sub Running', 'var(--danger)');
    
    window.pubsubStartTime = performance.now();
    addLog(`[Publisher] Sensor terbakar! Memberikan instruksi ke FastAPI untuk menyebarkan sinyal...`);
    
    // Animasi Node Sensor Meneruskan Data ke Hub Broker
    await sendPacket(pubSensor, pubBroker, 'pub', networkLatency);
    
    try {
        // TRIGGER PUBLISHER SECARA HTTP FETCH KE BACKEND
        await fetch('/api/pubsub/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        addLog(`[API] Instruksi berhasil masuk ke Backend. Backend kini sedang mempublikasikan (publish) ke Broker Mosquitto...`);
        // Sisa animasi akan ditangani MUTLAK di dalam blok mqttClient.onMessageArrived di atas!
    } catch (error) {
        console.error(error);
        addLog(`[Error] Gagal menghubungi backend untuk publish event! Detail: ${error.message}`);
        btnTriggerFire.disabled = false;
        isSimulationRunning = false;
    }
});
