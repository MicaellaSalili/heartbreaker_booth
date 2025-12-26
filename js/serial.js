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
        // FOR TESTING: Always generate high BPM (55-120)
        let fakeBPM = Math.floor(Math.random() * (120 - 55 + 1)) + 55;
        console.log("Generated BPM for testing:", fakeBPM);
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