document.addEventListener("DOMContentLoaded", function() {
    const codeReader = new ZXing.BrowserMultiFormatReader();
    const videoElement = document.createElement('video');
    videoElement.setAttribute('autoplay', '');
    videoElement.setAttribute('playsinline', '');
    document.querySelector('#scanner-container').appendChild(videoElement);

    async function startBarcodeScanning() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            videoElement.srcObject = stream;
            videoElement.play();
            codeReader.decodeFromVideoDevice(null, videoElement, (result, err) => {
                if (result) {
                    console.log("Barcode found:", result.text);
                    stopBarcodeScanning();
                    sendBarcodeToPreviousPage(result.text);
                }
                if (err) {
                    console.error("Error scanning barcode:", err);
                }
            });
            document.querySelector('.status').textContent = "Camera is on";
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Error accessing camera. Please ensure permissions are granted and try again.");
        }
    }

    function stopBarcodeScanning() {
        codeReader.reset();
        if (videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
        }
        document.querySelector('.status').textContent = "Scanning stopped";
    }

    function sendBarcodeToPreviousPage(barcode) {
        window.close();
        if (window.opener) {
            window.opener.handleSelectedBarcode(barcode);
        }
    }

    document.querySelector('.contagem-iniciar').addEventListener('click', startBarcodeScanning);
    document.querySelector('.stop-scanning').addEventListener('click', stopBarcodeScanning);

console.log("Video dimensions:", videoElement.videoWidth, videoElement.videoHeight);
console.log("Canvas dimensions:", canvas.width, canvas.height);
console.log("Image data:", imageData);
console.log("Barcode detection result:", code);

});