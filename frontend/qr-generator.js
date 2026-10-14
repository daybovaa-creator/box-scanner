// QR Code генерация в браузере
// Используем библиотеку qrcode.js

function generateQRCode(text, size = 300) {
    return new Promise((resolve, reject) => {
        // Создаём временный canvas
        const canvas = document.createElement('canvas');

        // Используем библиотеку QRCode
        QRCode.toCanvas(canvas, text, {
            width: size,
            margin: 2,
            errorCorrectionLevel: 'H'
        }, (error) => {
            if (error) {
                reject(error);
                return;
            }

            // Конвертируем в base64
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
        });
    });
}

async function generateBoxQRCodes(boxes) {
    const results = [];

    for (const box of boxes) {
        const qrDataUrl = await generateQRCode(box.code);
        results.push({
            code: box.code,
            qr: qrDataUrl
        });
    }

    return results;
}

// Скачать QR-код как изображение
function downloadQRCode(code, dataUrl) {
    const link = document.createElement('a');
    link.download = `${code}.png`;
    link.href = dataUrl;
    link.click();
}

// Скачать все QR-коды как PDF
async function downloadQRCodesAsPDF(boxes) {
    // Используем jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 20;
    const pageHeight = doc.internal.pageSize.height;

    for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];

        // Новая страница если не влезает
        if (y > pageHeight - 80) {
            doc.addPage();
            y = 20;
        }

        // Добавляем QR-код
        doc.addImage(box.qr, 'PNG', 20, y, 60, 60);

        // Добавляем текст
        doc.setFontSize(16);
        doc.text(box.code, 90, y + 30);

        y += 70;
    }

    doc.save('box-qr-codes.pdf');
}

window.QRGenerator = {
    generate: generateQRCode,
    generateBatch: generateBoxQRCodes,
    download: downloadQRCode,
    downloadPDF: downloadQRCodesAsPDF
};
