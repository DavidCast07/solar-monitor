const WebSocket = require('ws');
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Crear servidor HTTP
const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

// Almacenar datos históricos
let sensorDataHistory = {
    power: [],
    performance: [],
    irradiation: [],
    temperature: [],
    humidity:[],
    timestamps: []
};

wss.on('connection', (ws) => {
    console.log('Cliente WebSocket conectado');

    // Enviar datos históricos al nuevo cliente
    ws.send(JSON.stringify({
        type: 'historical_data',
        data: sensorDataHistory
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Datos recibidos del ESP32:', data);
            
            // Procesar datos del ESP32
            if (data.type === 'sensor_data') {
                // Agregar timestamp
                const timestamp = new Date().toLocaleTimeString();
                
                // Actualizar datos históricos (mantener últimos 50 puntos)
                sensorDataHistory.power.push(data.power);
                sensorDataHistory.performance.push(data.performance);
                sensorDataHistory.irradiation.push(data.irradiation);
                sensorDataHistory.temperature.push(data.temperature);
                sensorDataHistory.humidity.push(data.humidity);
                sensorDataHistory.timestamps.push(timestamp);
                
                // Mantener solo los últimos 50 datos
                const maxDataPoints = 50;
                if (sensorDataHistory.power.length > maxDataPoints) {
                    sensorDataHistory.power.shift();
                    sensorDataHistory.performance.shift();
                    sensorDataHistory.irradiation.shift();
                    sensorDataHistory.temperature.shift();
                    sensorDataHistory.humidity.shift();
                    sensorDataHistory.timestamps.shift();
                }
                
                // Enviar a todos los clientes conectados
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'update',
                            data: data,
                            timestamp: timestamp
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Error procesando mensaje:', error);
        }
    });

    ws.on('close', () => {
        console.log('Cliente WebSocket desconectado');
    });
});

console.log(`WebSocket server corriendo en puerto ${PORT}`);