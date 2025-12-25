let port;
let reader;

async function connectSerial() {
    try {
        // Request a port and open a connection.
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });

        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();

        // Read data in a loop
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
                // Assuming Arduino sends: "BPM: 75"
                parseBPM(value); 
            }
        }
    } catch (error) {
        console.error("Serial Connection Failed", error);
    }
}

function parseBPM(data) {
    const bpmMatch = data.match(/\d+/); // Extracts the number from the serial string
    if (bpmMatch) {
        let currentBPM = parseInt(bpmMatch[0]);
        document.dispatchEvent(new CustomEvent('bpmUpdate', { detail: currentBPM }));
    }
}