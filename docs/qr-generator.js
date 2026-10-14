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

// Скачать все QR-коды как PDF (1 стикер 120×75 мм = 1 лист A4)
async function downloadQRCodesAsPDF(boxes) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Стикер Ozon: 120×75 мм
    const stickerWidth = 120;
    const stickerHeight = 75;

    // Центрируем на листе A4 (210×297 мм)
    const pageWidth = 210;
    const pageHeight = 297;
    const x = (pageWidth - stickerWidth) / 2;
    const y = (pageHeight - stickerHeight) / 2;

    for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];

        if (i > 0) {
            doc.addPage();
        }

        // КРУПНЫЙ НОМЕР КОРОБКИ СВЕРХУ (видно без сканирования!)
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        const titleY = y + 15;
        doc.text(box.code, x + stickerWidth / 2, titleY, { align: 'center' });

        // QR-код под номером (35×35 мм, компактный)
        const qrSize = 35;
        const qrX = x + (stickerWidth - qrSize) / 2;
        const qrY = titleY + 10;
        doc.addImage(box.qr, 'PNG', qrX, qrY, qrSize, qrSize);
    }

    doc.save('box-stickers-ozon-120x75.pdf');
}

window.QRGenerator = {
    generate: generateQRCode,
    generateBatch: generateBoxQRCodes,
    download: downloadQRCode,
    downloadPDF: downloadQRCodesAsPDF
};
