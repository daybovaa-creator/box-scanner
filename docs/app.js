// API Configuration
// Измени на адрес своего сервера после деплоя backend
const API_BASE = 'http://localhost:8000';  // TODO: заменить на https://your-server.com

// API Helper Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API Error');
        }

        return await response.json();
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
}

async function uploadFile(endpoint, file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload Error');
        }

        return await response.json();
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
}

// Check API Status
async function checkApiStatus() {
    const statusEl = document.getElementById('api-status');
    if (!statusEl) return;

    try {
        await fetch(`${API_BASE}/health`);
        statusEl.textContent = '✅ Подключено';
        statusEl.style.color = '#10b981';
    } catch (error) {
        statusEl.textContent = '❌ Не подключено';
        statusEl.style.color = '#ef4444';
    }
}

// Show Alert
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.container main');
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => alertDiv.remove(), 5000);
}

// QR Code Scanner (using html5-qrcode library)
class BarcodeScanner {
    constructor(videoElementId, onScan) {
        this.videoElement = document.getElementById(videoElementId);
        this.onScan = onScan;
        this.stream = null;
    }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            this.videoElement.srcObject = this.stream;
            this.videoElement.play();

            // Start barcode detection (simplified - in production use html5-qrcode library)
            this.detectBarcode();
        } catch (error) {
            console.error('Camera Error:', error);
            showAlert('Не удалось получить доступ к камере', 'danger');
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }
    }

    detectBarcode() {
        // Placeholder for barcode detection
        // В реальной версии используй библиотеку html5-qrcode
        console.log('Barcode detection started');
    }
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Parse Articles from Text
function parseArticles(text) {
    // Разбиваем по строкам и фильтруем пустые
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

// Get Query Parameter
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Set Query Parameter
function setQueryParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

// Loading State
function setLoading(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (isLoading) {
        element.disabled = true;
        element.dataset.originalText = element.textContent;
        element.textContent = 'Загрузка...';
    } else {
        element.disabled = false;
        element.textContent = element.dataset.originalText;
    }
}

// Export for use in other files
window.API = {
    call: apiCall,
    uploadFile: uploadFile,
    BASE: API_BASE
};

window.Utils = {
    showAlert,
    formatDate,
    parseArticles,
    getQueryParam,
    setQueryParam,
    setLoading,
    BarcodeScanner,
    checkApiStatus
};
