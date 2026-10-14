// QR Code генерация в браузере
// Используем библиотеку qrcode-generator

function generateQRCode(text, size = 300) {
    return new Promise((resolve, reject) => {
        try {
            // Создаём QR-код (typeNumber=0 = auto, errorCorrectionLevel='H' = high)
            const qr = qrcode(0, 'H');
            qr.addData(text);
            qr.make();

            // Создаём canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const moduleCount = qr.getModuleCount();
            const cellSize = Math.floor(size / moduleCount);
            canvas.width = cellSize * moduleCount;
            canvas.height = cellSize * moduleCount;

            // Рисуем белый фон
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Рисуем чёрные модули
            ctx.fillStyle = '#000000';
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                    }
                }
            }

            // Конвертируем в Data URL
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
        } catch (error) {
            reject(error);
        }
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
// ========================================
// КРУПНЫЙ НОМЕР СВЕРХУ + 2D ШТРИХКОД СНИЗУ!
// Сборщик видит номер коробки БЕЗ СКАНИРОВАНИЯ!
// ========================================
async function downloadQRCodesAsPDF(boxes) {
    console.log('=== downloadQRCodesAsPDF START ===');
    console.log('Количество коробок:', boxes.length);
    console.log('Первая коробка:', boxes[0]);

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

        console.log(`Коробка ${i + 1}: code="${box.code}", qr=${box.qr ? 'OK' : 'MISSING'}`);

        if (i > 0) {
            doc.addPage();
        }

        // ======================================
        // КРУПНЫЙ НОМЕР КОРОБКИ СВЕРХУ!
        // Сборщик видит номер БЕЗ СКАНИРОВАНИЯ!
        // ======================================
        doc.setFontSize(64);  // ← 64pt КРУПНЕЙШИЙ!
        doc.setFont('helvetica', 'bold');

        // Рисуем рамку стикера (для визуализации)
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, stickerWidth, stickerHeight);

        // НОМЕР В ЦЕНТРЕ ВЕРХНЕЙ ЧАСТИ
        const textY = y + 25;
        doc.text(box.code, x + stickerWidth / 2, textY, { align: 'center' });

        // 2D штрихкод (QR) под номером
        const qrSize = 45;
        const qrX = x + (stickerWidth - qrSize) / 2;
        const qrY = textY + 5;
        doc.addImage(box.qr, 'PNG', qrX, qrY, qrSize, qrSize);
    }

    console.log('=== downloadQRCodesAsPDF END ===');
    doc.save('box-stickers-ozon-120x75.pdf');
}

window.QRGenerator = {
    generate: generateQRCode,
    generateBatch: generateBoxQRCodes,
    download: downloadQRCode,
    downloadPDF: downloadQRCodesAsPDF
};
