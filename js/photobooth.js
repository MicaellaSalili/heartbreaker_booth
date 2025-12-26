// Function to request camera access
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1920 }, 
                height: { ideal: 1080 },
                facingMode: "user" 
            }, 
            audio: false 
        });
        const video = document.getElementById('webcam');
        video.srcObject = stream;
        // Wait for the video to actually start playing before showing it
        video.onloadedmetadata = () => {
            video.play();
            console.log("Camera started successfully");
        };
    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert("Camera blocked! Please click the 'Camera' icon in the browser address bar to allow access.");
    }
}

// IMPORTANT: Call the function so it runs on page load
setupCamera();


// Ensure your canvas matches the ASPECT RATIO of your Canva frame (9:16)



const video = document.getElementById('webcam');
const previewCanvas = document.getElementById('preview-canvas');
const pCtx = previewCanvas.getContext('2d');
const frame = new Image();
frame.src = 'assets/frame.png';

// Timer overlay
let timerOverlay = null;
function showTimer(seconds, callback) {
    if (!timerOverlay) {
        timerOverlay = document.createElement('div');
        timerOverlay.id = 'timer-overlay';
        timerOverlay.style.position = 'absolute';
        timerOverlay.style.top = '50%';
        timerOverlay.style.left = '50%';
        timerOverlay.style.transform = 'translate(-50%, -50%)';
        timerOverlay.style.zIndex = '10';
        timerOverlay.style.background = 'rgba(0,0,0,0.0)';
        timerOverlay.style.color = '#fff';
        timerOverlay.style.fontSize = '6rem';
        timerOverlay.style.fontWeight = 'bold';
        timerOverlay.style.borderRadius = '50%';
        timerOverlay.style.width = '180px';
        timerOverlay.style.height = '180px';
        timerOverlay.style.display = 'flex';
        timerOverlay.style.alignItems = 'center';
        timerOverlay.style.justifyContent = 'center';
        timerOverlay.style.border = '10px solid #fff';
        timerOverlay.style.boxSizing = 'border-box';
        timerOverlay.style.pointerEvents = 'none';
        // Attach to video-wrap
        const videoWrap = document.querySelector('.video-wrap');
        if (videoWrap) videoWrap.appendChild(timerOverlay);
    }
    let timeLeft = seconds;
    timerOverlay.innerText = timeLeft;
    timerOverlay.style.display = 'flex';
    const interval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            timerOverlay.innerText = timeLeft;
        } else {
            clearInterval(interval);
            timerOverlay.style.display = 'none';
            if (callback) callback();
        }
    }, 1000);
}

let snapshots = [null, null]; 
let currentStep = 0; // 0 for Player 1, 1 for Player 2

// Initialize Canvas once frame loads
frame.onload = () => {
    previewCanvas.width = frame.width;
    previewCanvas.height = frame.height;
    updatePreview();
};

document.getElementById('snap-btn').onclick = () => takeSnapshot();
document.getElementById('snap-btn').onclick = () => startCaptureWithTimer();
document.getElementById('retake-btn').onclick = () => retake();

function takeSnapshot() {
    // Capture the current frame from video
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.drawImage(video, 0, 0);
    
    snapshots[currentStep] = tempCanvas;
    updatePreview();

    // Show Retake option and Next/Download option
    document.getElementById('retake-btn').style.display = 'inline-block';
    const snapBtn = document.getElementById('snap-btn');

    if (currentStep === 0) {
        snapBtn.innerText = "NEXT: PLAYER 2 ➡️";
        snapBtn.onclick = () => startPlayer2();
    } else {
        snapBtn.innerText = "📥 DOWNLOAD RESULT";
        snapBtn.onclick = () => downloadFinal();
    }
}

function startCaptureWithTimer() {
    // Disable snap button during timer
    const snapBtn = document.getElementById('snap-btn');
    snapBtn.disabled = true;
    showTimer(5, () => {
        snapBtn.disabled = false;
        takeSnapshot();
    });
}

function takeSnapshot() {
    // Capture the current frame from video, mirrored
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tCtx = tempCanvas.getContext('2d');
    // Mirror horizontally
    tCtx.save();
    tCtx.translate(tempCanvas.width, 0);
    tCtx.scale(-1, 1);
    tCtx.drawImage(video, 0, 0);
    tCtx.restore();
    snapshots[currentStep] = tempCanvas;
    updatePreview();

    // Show Retake option and Next/Download option
    document.getElementById('retake-btn').style.display = 'inline-block';
    const snapBtn = document.getElementById('snap-btn');

    if (currentStep === 0) {
        snapBtn.innerText = "NEXT: PLAYER 2 ➡️";
        snapBtn.onclick = () => startPlayer2();
    } else {
        snapBtn.innerText = "📥 DOWNLOAD RESULT";
        snapBtn.onclick = () => downloadFinal();
    }
}

function retake() {
    snapshots[currentStep] = null;
    updatePreview();
    
    document.getElementById('retake-btn').style.display = 'none';
    const snapBtn = document.getElementById('snap-btn');
    snapBtn.innerText = "📸 CAPTURE PHOTO";
    snapBtn.onclick = () => takeSnapshot();
}


// Function to update the UI text and color
function updateStatus(text, color) {
    const status = document.getElementById('capture-status');
    status.innerText = text;
    status.style.color = color;
}

// Initial Page Load
updateStatus("Ready Player 1?", "#e63946");

document.getElementById('snap-btn').onclick = () => takeSnapshot();

function takeSnapshot() {
    // Capture from video
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.drawImage(video, 0, 0);
    
    snapshots[currentStep] = tempCanvas;
    updatePreview();

    // Change status after snapping
    updateStatus("Looking good, Player " + (currentStep + 1) + "?", "#00f2ff");

    document.getElementById('retake-btn').style.display = 'inline-block';
    const snapBtn = document.getElementById('snap-btn');

    if (currentStep === 0) {
        snapBtn.innerText = "CONFIRM & NEXT ➡️";
        snapBtn.onclick = () => startPlayer2();
    } else {
        snapBtn.innerText = "📥 DOWNLOAD RESULT";
        snapBtn.onclick = () => downloadFinal();
    }
}

function retake() {
    snapshots[currentStep] = null;
    updatePreview();
    
    // Revert status back to "Ready"
    updateStatus("Ready Player " + (currentStep + 1) + "?", "#e63946");
    
    document.getElementById('retake-btn').style.display = 'none';
    const snapBtn = document.getElementById('snap-btn');
    snapBtn.innerText = "📸 CAPTURE PHOTO";
    snapBtn.onclick = () => takeSnapshot();
}

function startPlayer2() {
    currentStep = 1;
    // Now it only says "Ready Player 2" AFTER Player 1 has confirmed
    updateStatus("Ready Player 2?", "#e63946");
    
    document.getElementById('retake-btn').style.display = 'none';
    const snapBtn = document.getElementById('snap-btn');
    snapBtn.innerText = "📸 CAPTURE PHOTO";
    snapBtn.onclick = () => takeSnapshot();
}


function updatePreview() {
    pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    const sW = vW;
    const sH = vW * (1680 / 2985); // Matches your window ratio
    const sY = (vH - sH) / 2;

    // Draw Player 1
    if (snapshots[0]) {
        pCtx.drawImage(snapshots[0], 0, sY, sW, sH, 195, 1140, 2985, 1680);
    }
    // Draw Player 2
    if (snapshots[1]) {
        pCtx.drawImage(snapshots[1], 0, sY, sW, sH, 195, 3180, 2985, 1680);
    }
}

// Mirror the video preview
video.addEventListener('loadedmetadata', () => {
    video.style.transform = 'scaleX(-1)';
});

function downloadFinal() {
    const finalCanvas = document.getElementById('final-canvas');
    finalCanvas.width = frame.width;
    finalCanvas.height = frame.height;
    const fCtx = finalCanvas.getContext('2d');

    // Redraw everything high-res
    updatePreview(); // Ensure pCtx is fresh
    fCtx.drawImage(previewCanvas, 0, 0);
    fCtx.drawImage(frame, 0, 0);

    const p1Name = localStorage.getItem('p1Name') || 'player1';
    const p2Name = localStorage.getItem('p2Name') || 'player2';
    const fileName = `${p1Name}_${p2Name}.png`;
    const link = document.createElement('a');
    link.download = fileName;
    link.href = finalCanvas.toDataURL("image/png");
    link.click();
}

function resetBooth() {
    // Clear the player data from memory
    localStorage.clear();
    // Go back to the registration page
    window.location.href = "index.html";
}