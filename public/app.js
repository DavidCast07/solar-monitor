// Configuración WebSocket
const ws = new WebSocket('ws://localhost:3000');

// Variables para gráficos
let irradiationChart;
let historicalData = {
    power: [],
    performance: [],
    irradiation: [],
    temperature: [],
    humidity:[],
    timestamps: []
};

// Elementos de la interfaz
const connectionIndicator = document.getElementById('connection-indicator');
const connectionText = document.getElementById('connection-text');
const lastUpdateElement = document.getElementById('last-update');
const trendElement = document.getElementById('trend');

// Configurar WebSocket
ws.onopen = function(event) {
    console.log('Conectado al servidor WebSocket');
    updateConnectionStatus(true);
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'update') {
        // Actualizar datos en tiempo real
        updateDashboard(data.data);
        updateCharts(data.data);
        lastUpdateElement.textContent = `Última actualización: ${data.timestamp}`;
    } else if (data.type === 'historical_data') {
        // Cargar datos históricos
        historicalData = data.data;
        initializeCharts();
    }
};

ws.onclose = function(event) {
    console.log('Conexión WebSocket cerrada');
    updateConnectionStatus(false);
};

ws.onerror = function(error) {
    console.error('Error en WebSocket:', error);
    updateConnectionStatus(false);
};

// Función para actualizar estado de conexión
function updateConnectionStatus(connected) {
    if (connected) {
        connectionIndicator.style.backgroundColor = '#2ecc71';
        connectionText.textContent = 'Conectado al ESP32';
        connectionText.style.color = '#2ecc71';
    } else {
        connectionIndicator.style.backgroundColor = '#e74c3c';
        connectionText.textContent = 'Desconectado';
        connectionText.style.color = '#e74c3c';
    }
}

// Función para actualizar el dashboard
function updateDashboard(data) {
    updatePowerData(data.power);
    updatePerformanceData(data.performance);
    updateIrradiationData(data.irradiation);
    updateTemperatureData(data.temperature);
    updateHumidityData(data.humidity);
}

// Función para actualizar datos de potencia
function updatePowerData(power) {
    const powerElement = document.getElementById('current-power');
    powerElement.textContent = `${power.toFixed(1)} W`;
    
    if (power > 3) {
        powerElement.style.color = '#2ecc71';
    } else if (power > 1.5) {
        powerElement.style.color = '#f39c12';
    } else {
        powerElement.style.color = '#e74c3c';
    }
}

// Función para actualizar datos de rendimiento
function updatePerformanceData(performance) {
    const performanceElement = document.getElementById('performance');
    const performanceBar = document.getElementById('performance-bar');
    
    performanceElement.textContent = `${Math.round(performance)}%`;
    performanceBar.style.width = `${performance}%`;
    
    if (performance > 80) {
        performanceBar.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
    } else if (performance > 60) {
        performanceBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
    } else {
        performanceBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
    }
}

// Función para actualizar datos de irradiación
function updateIrradiationData(irradiation) {
    const irradiationElement = document.getElementById('irradiation');
    const irradiationLevel = document.getElementById('irradiation-level');
    const currentIrradiationElement = document.getElementById('current-irradiation');
    
    irradiationElement.textContent = `${irradiation.toFixed(1)} W/m²`;
    currentIrradiationElement.textContent = `${irradiation.toFixed(1)} W/m²`;
    
    const percentage = Math.min((irradiation / 1000) * 100, 100);
    irradiationLevel.style.width = `${percentage}%`;
    
    if (irradiation > 700) {
        irradiationElement.style.color = '#e74c3c';
    } else if (irradiation > 400) {
        irradiationElement.style.color = '#f39c12';
    } else {
        irradiationElement.style.color = '#3498db';
    }
}

// Función para actualizar datos de temperatura
function updateTemperatureData(temperature) {
    const temperatureElement = document.getElementById('panel-temperature');
    const temperatureLevel = document.getElementById('temperature-level');
    
    temperatureElement.textContent = `${temperature.toFixed(1)} °C`;
    
    const percentage = Math.min((temperature / 60) * 100, 100);
    temperatureLevel.style.width = `${percentage}%`;
    
    if (temperature > 45) {
        temperatureElement.style.color = '#e74c3c';
    } else if (temperature > 30) {
        temperatureElement.style.color = '#f39c12';
    } else {
        temperatureElement.style.color = '#3498db';
    }
}

//humedad
function updateHumidityData(humidity){
    const humidityElement = document.getElementById('humidity');
    
    humidityElement.textContent = `${humidity.toFixed(1)} %`
}

// Función para calcular tendencia
function calculateTrend() {
    if (historicalData.irradiation.length < 3) {
        return "Estable";
    }
    
    const recentData = historicalData.irradiation.slice(-3);
    const first = recentData[0];
    const last = recentData[recentData.length - 1];
    const difference = last - first;
    const percentageChange = (difference / first) * 100;
    
    if (percentageChange > 10) {
        return "↑ Subiendo";
    } else if (percentageChange < -10) {
        return "↓ Bajando";
    } else {
        return "→ Estable";
    }
}

// Inicializar gráficos
function initializeCharts() {
    const irradiationCtx = document.getElementById('irradiation-chart').getContext('2d');
    
    // Gráfico de irradiación extendido
    irradiationChart = new Chart(irradiationCtx, {
        type: 'line',
        data: {
            labels: historicalData.timestamps,
            datasets: [{
                label: 'Irradiación Solar',
                data: historicalData.irradiation,
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#f39c12',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Irradiación (W/m²)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Tiempo',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 14
                    },
                    padding: 10
                }
            }
        }
    });

    // Actualizar resumen inicial
    updateIrradiationSummary();
}

// Actualizar gráficos con nuevos datos
function updateCharts(data) {
    const now = new Date().toLocaleTimeString();
    
    // Agregar nuevos datos
    historicalData.irradiation.push(data.irradiation);
    historicalData.timestamps.push(now);
    
    // Mantener solo los últimos 20 puntos (más datos para gráfico extendido)
    const maxPoints = 20;
    if (historicalData.irradiation.length > maxPoints) {
        historicalData.irradiation.shift();
        historicalData.timestamps.shift();
    }
    
    // Actualizar gráfico
    if (irradiationChart) {
        irradiationChart.data.labels = historicalData.timestamps;
        irradiationChart.data.datasets[0].data = historicalData.irradiation;
        irradiationChart.update('none');
    }

    // Actualizar resumen
    updateIrradiationSummary();
}

// Función para actualizar el resumen de irradiación
function updateIrradiationSummary() {
    if (historicalData.irradiation.length > 0) {
        const maxIrradiation = Math.max(...historicalData.irradiation);
        const avgIrradiation = historicalData.irradiation.reduce((a, b) => a + b, 0) / historicalData.irradiation.length;
        const trend = calculateTrend();
        
        document.getElementById('max-irradiation').textContent = `${maxIrradiation.toFixed(1)} W/m²`;
        document.getElementById('avg-irradiation').textContent = `${avgIrradiation.toFixed(1)} W/m²`;
        
        // Actualizar tendencia con colores
        trendElement.textContent = trend;
        if (trend.includes("↑")) {
            trendElement.style.color = '#2ecc71';
        } else if (trend.includes("↓")) {
            trendElement.style.color = '#e74c3c';
        } else {
            trendElement.style.color = '#f39c12';
        }
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard inicializado, esperando datos...');
});