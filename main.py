from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import paho.mqtt.client as mqtt

app = FastAPI(title="Smart Home Simulation API")

# Setup MQTT Client for publishing (Bertindak sebagai Publisher)
mqtt_broker_host = "localhost"
mqtt_broker_port = 1884
mqtt_topic = "smarthome/alert"

# Kompatibilitas dengan versi terbaru Paho MQTT
if hasattr(mqtt, 'CallbackAPIVersion'):
    publisher_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="fastapi_publisher")
else:
    publisher_client = mqtt.Client(client_id="fastapi_publisher")

try:
    # Memulai loop background sebelum connect agar otomatis reconnect misal broker mati
    publisher_client.loop_start()
    publisher_client.connect_async(mqtt_broker_host, mqtt_broker_port, 60)
except Exception as e:
    print(f"[MQTT Error] Cannot start bg client: {e}")

class ToggleRequest(BaseModel):
    isLightOn: bool

@app.post("/api/reqres/toggle")
async def toggle_device(req: ToggleRequest):
    # Simulasi memproses perubahan state (misalnya, instruksi ke hardware sungguhan)
    new_state = not req.isLightOn
    state_str = "ON" if new_state else "OFF"
    print(f"[Req-Res] Menerima instruksi. Status target lampu adalah {state_str}")
    
    return {
        "status": "success", 
        "device": "Smart Bulb", 
        "state": state_str, 
        "isLightOn": new_state
    }

@app.post("/api/pubsub/trigger")
async def trigger_event():
    # Endpoint ini menyimulasikan SENSOR API yang akan mem-publish data ke broker MQTT
    try:
        print("[Pub-Sub] Mempublikasikan peringatan FIRE ke MQTT Broker...")
        # Payload bisa berupa JSON atau string. Di sini cukup string "FIRE".
        publisher_client.publish(mqtt_topic, payload="FIRE", qos=0)
        return {"status": "success", "message": "Peringatan dikirim ke broker"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# Memuat Web (HTML/CSS/JS) di root ('/')
app.mount("/", StaticFiles(directory=".", html=True), name="static")
