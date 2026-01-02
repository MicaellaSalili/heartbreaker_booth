// Custom Modal Functions
function showModal(title, message, type = 'info', buttons = []) {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalIcon = document.getElementById('modal-icon');
    const modalButtons = document.getElementById('modal-buttons');

    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    
    // Set icon based on type
    if (type === 'success') {
        modalIcon.innerHTML = '✅';
        modalIcon.className = 'modal-icon success';
    } else if (type === 'error') {
        modalIcon.innerHTML = '❌';
        modalIcon.className = 'modal-icon error';
    } else if (type === 'warning') {
        modalIcon.innerHTML = '⚠️';
        modalIcon.className = 'modal-icon warning';
    }

    // Clear and add buttons
    modalButtons.innerHTML = '';
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'modal-btn';
        button.textContent = btn.text;
        button.onclick = () => {
            closeModal();
            if (btn.action) btn.action();
        };
        modalButtons.appendChild(button);
    });

    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('custom-modal');
    modal.style.display = 'none';
}

// Global variable to track connection state (exposed to window for cross-file access)
window.isConnected = false;
let isConnected = false;
let serialPort = null;
let serialReader = null;

// Function to update status text
function updateStatusText(text) {
    const statusText = document.getElementById('status-text');
    if (statusText) {
        statusText.innerText = text;
    }
}

// Function to handle disconnection
function handleDisconnection() {
    isConnected = false;
    window.isConnected = false;
    serialPort = null;
    serialReader = null;
    updateStatusText('Connection Lost - Please Reconnect');
    console.warn('Arduino disconnected');
    
    // Show reconnection modal
    showModal(
        'Connection Lost',
        'Arduino has been disconnected.<br>Please reconnect to continue.',
        'error',
        [{ text: 'Reconnect', action: () => {
            window.location.reload();
        }}]
    );
}

// Function to handle Real Arduino Connection
async function connectSerial() {
    try {
        updateStatusText('Selecting port...');
        const port = await navigator.serial.requestPort();
        
        // Get port info to validate it's a COM port
        const portInfo = port.getInfo();
        console.log("Port info:", portInfo);
        
        // Only proceed if it looks like a valid serial port (COM port)
        // Note: COM ports typically have usbVendorId and usbProductId
        if (!portInfo.usbVendorId) {
            updateStatusText('Invalid Port - Try Again');
            showModal(
                'Invalid Port Selected',
                'Please select a COM port (Arduino USB connection).<br>The selected port does not appear to be a valid serial device.',
                'error',
                [{ text: 'Try Again', action: connectSerial }]
            );
            return false;
        }
        
        updateStatusText('Connecting to Arduino...');
        await port.open({ baudRate: 9600 });
        serialPort = port;
        isConnected = true;
        window.isConnected = true;
        updateStatusText('Connected! Reading heart rate...');
        
        // Start reading serial data immediately in the background
        startSerialReading(port);
        
        // Success message
        showModal(
            'Connection Successful!',
            'Arduino connected successfully!<br>Heart sensor is ready.<br><br>You should see live BPM readings now.',
            'success',
            [{ text: 'Start Game', action: () => {
                document.getElementById('connect-btn').style.display = 'none';
                const p1Btn = document.getElementById('start-p1-btn');
                const p2Btn = document.getElementById('start-p2-btn');
                if (p1Btn && p2Btn) {
                    p1Btn.style.display = 'inline-block';
                    p2Btn.style.display = 'inline-block';
                }
            }}]
        );
        console.log("Arduino connected on port:", port);
        
        return true;
        return true;
    } catch (err) {
        console.error("Serial error:", err);
        isConnected = false;
        window.isConnected = false;
        serialPort = null;
        serialReader = null;
        updateStatusText('Connection Failed - Try Again');
        
        // Check if user canceled the dialog
        if (err.name === 'NotFoundError' || err.message.includes('No port selected')) {
            updateStatusText('No Port Selected');
            showModal(
                'Connection Canceled',
                'No port was selected.<br>Please connect your Arduino and try again.',
                'warning',
                [{ text: 'Retry Connection', action: connectSerial }]
            );
        } else if (err.name === 'NetworkError' || err.message.includes('Failed to open')) {
            showModal(
                'Connection Failed',
                'Failed to connect to Arduino.<br><br><strong>Please check:</strong><br>• Arduino is plugged in<br>• Arduino IDE Serial Monitor is closed<br>• Correct COM port is selected',
                'error',
                [{ text: 'Retry Connection', action: connectSerial }]
            );
        } else if (err.name === 'InvalidStateError' || err.message.includes('already open')) {
            updateStatusText('Port Already Open');
            showModal(
                'Port Busy',
                'The selected port is already in use.<br>Please close any other applications using this port.',
                'error',
                [{ text: 'Retry Connection', action: connectSerial }]
            );
        } else {
            showModal(
                'Connection Error',
                `An unexpected error occurred:<br><br>${err.message}`,
                'error',
                [{ text: 'Retry Connection', action: connectSerial }]
            );
        }
        
        return false;
    }
}

// Function to start reading serial data in the background
async function startSerialReading(port) {
    try {
        // Properly set up the text decoder stream
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        serialReader = textDecoder.readable.getReader();

        console.log('Started reading serial data...');
        
        // Read data in a loop with error handling
        while (true) {
            const { value, done } = await serialReader.read();
            if (done) {
                console.log('Serial reader done');
                serialReader.releaseLock();
                handleDisconnection();
                break;
            }
            if (value) {
                console.log("📥 RAW Serial data received:", value);
                parseBPM(value);
            }
        }
    } catch (readError) {
        console.error('Error reading serial data:', readError);
        if (serialReader) {
            try {
                serialReader.releaseLock();
            } catch (e) {
                console.error('Error releasing reader:', e);
            }
        }
        handleDisconnection();
    }
}

function parseBPM(data) {
    if (!data || typeof data !== 'string') {
        console.warn("❌ Invalid data type received:", typeof data);
        return;
    }
    
    console.log("🔍 Parsing data:", data.substring(0, 100)); // Show first 100 chars
    
    // Look specifically for "BPM: XXX" pattern to avoid reading Signal values
    const bpmMatch = data.match(/BPM:\s*(\d+)/i);
    if (bpmMatch) {
        let currentBPM = parseInt(bpmMatch[1]);
        console.log("✅ Found BPM pattern:", currentBPM);
        
        // Validate BPM is in reasonable range (30-250)
        if (currentBPM >= 30 && currentBPM <= 250) {
            console.log("✅ Valid BPM - Dispatching event:", currentBPM);
            // Dispatches the event that battle.js is listening for
            document.dispatchEvent(new CustomEvent('bpmUpdate', { detail: currentBPM }));
        } else if (currentBPM > 0) {
            // If BPM is between 1-29 or over 250, still show it but warn
            console.warn("⚠️ BPM out of normal range (30-250):", currentBPM);
            document.dispatchEvent(new CustomEvent('bpmUpdate', { detail: currentBPM }));
        } else {
            console.warn("❌ Invalid BPM value received:", currentBPM);
        }
    } else {
        console.log("⚠️ No BPM pattern found in data");
    }
}