let isSimulating = false;
let simInterval;

// Function to handle Real Arduino Connection
async function connectSerial() {
    // If you want to test without hardware, call startSimulation() instead
    try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        const reader = port.readable.pipeTo(new TextDecoderStream()).readable.getReader();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) parseBPM(value);
        }
    } catch (err) {
        console.error("Serial error:", err);
        alert("No device found. Starting Simulation Mode for testing!");
        startSimulation();
    }
}

// SIMULATION LOGIC: Mimics Arduino sending data
function startSimulation() {
    if (isSimulating) return;
    isSimulating = true;
    console.log("Simulated Heart Rate Monitor Started...");

    simInterval = setInterval(() => {
        // Generates a random BPM between 65 and 95
        const fakeBPM = Math.floor(Math.random() * (95 - 65 + 1)) + 65;
        parseBPM(fakeBPM.toString());
    }, 1000); // Sends data every 1 second
}

function stopSimulation() {
    clearInterval(simInterval);
    isSimulating = false;
}

function parseBPM(data) {
    const bpmMatch = data.match(/\d+/); 
    if (bpmMatch) {
        let currentBPM = parseInt(bpmMatch[0]);
        // Dispatches the event that battle.js is listening for
        document.dispatchEvent(new CustomEvent('bpmUpdate', { detail: currentBPM }));
    }
}