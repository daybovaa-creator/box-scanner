// ===== QR-ГЕНЕРАТОР С БИБЛИОТЕКОЙ qrcode-generator =====

function generateQRCode(text, size = 300) {
    return new Promise((resolve, reject) => {
        try {
            // Проверяем загружена ли библиотека qrcode-generator
            if (typeof qrcode === 'undefined') {
                reject(new Error('QRCode библиотека не загружена'));
                return;
            }
            
            // Создаём QR-код (typeNumber=0 = auto, 'H' = high error correction)
            const qr = qrcode(0, 'H');
            qr.addData(text);
            qr.make();
            
            // Генерируем PNG через Canvas
            const canvas = document.createElement('canvas');
            const moduleCount = qr.getModuleCount();
            const cellSize = Math.floor(size / moduleCount);
            const canvasSize = cellSize * moduleCount;
            
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            
            const ctx = canvas.getContext('2d');
            
            // Белый фон
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvasSize, canvasSize);
            
            // Чёрные модули
            ctx.fillStyle = '#000000';
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                    }
                }
            }
            
            // Конвертируем в data URL
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

// ✅ Скачать все QR-коды как ЭТИКЕТКИ (PDF)
async function downloadQRCodesAsPDF(boxes) {
    const { jsPDF } = window.jspdf;
    
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    const labelWidth = 100;
    const labelHeight = 70;
    const margin = 5;
    
    const labelsPerRow = 2;
    const labelsPerCol = 4;
    const labelsPerPage = labelsPerRow * labelsPerCol;
    
    for (let i = 0; i < boxes.length; i++) {
        if (i > 0 && i % labelsPerPage === 0) {
            doc.addPage();
        }
        
        const box = boxes[i];
        const labelIndex = i % labelsPerPage;
        const row = Math.floor(labelIndex / labelsPerRow);
        const col = labelIndex % labelsPerRow;
        
        const x = margin + col * (labelWidth + margin);
        const y = margin + row * (labelHeight + margin);

        // Рамка
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(x, y, labelWidth, labelHeight);

        // НОМЕР КОРОБКИ (крупный, жирный)
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(box.code, x + labelWidth / 2, y + 10, { align: 'center' });

        // QR-код
        const qrSize = 40;
        const qrX = x + (labelWidth - qrSize) / 2;
        const qrY = y + 18;
        doc.addImage(box.qr, 'PNG', qrX, qrY, qrSize, qrSize);

        // Дата
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, x + 2, y + labelHeight - 3);
    }

    doc.save('box-qr-labels.pdf');
}

// ✅ Скачать как HTML для предпросмотра
function downloadQRCodesAsHTML(boxes) {
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Этикетки коробок</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 5mm; background: #f0f0f0; }
        .page {
            width: 210mm; height: 297mm; background: white; padding: 5mm;
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 5mm;
            break-after: page; page-break-after: always; margin: 0 auto 10mm;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .label {
            width: 100mm; height: 70mm; border: 2px solid #000; padding: 8px;
            display: flex; flex-direction: column; justify-content: space-between;
            align-items: center; page-break-inside: avoid; break-inside: avoid;
        }
        .label-code { font-size: 24px; font-weight: bold; text-align: center; }
        .label-qr { flex: 1; display: flex; align-items: center; justify-content: center; }
        .label-qr img { max-width: 50mm; max-height: 50mm; }
        .label-date { font-size: 8px; color: #666; text-align: center; width: 100%; }
        @media print {
            body { padding: 0; background: white; }
            .page { box-shadow: none; margin: 0; }
        }
    </style>
</head>
<body>
    ${generatePagesHTML(boxes)}
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `box-qr-labels-${new Date().getTime()}.html`;
    link.click();
    URL.revokeObjectURL(url);
}

function generatePagesHTML(boxes) {
    let html = '';
    const labelsPerPage = 8;
    
    for (let i = 0; i < boxes.length; i += labelsPerPage) {
        html += '<div class="page">';
        
        for (let j = 0; j < labelsPerPage && (i + j) < boxes.length; j++) {
            const box = boxes[i + j];
            html += `
            <div class="label">
                <div class="label-code">${box.code}</div>
                <div class="label-qr"><img src="${box.qr}" alt="${box.code}"></div>
                <div class="label-date">Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
            </div>`;
        }
        
        html += '</div>';
    }
    
    return html;
}

window.QRGenerator = {
    generate: generateQRCode,
    generateBatch: generateBoxQRCodes,
    download: downloadQRCode,
    downloadPDF: downloadQRCodesAsPDF,
    downloadHTML: downloadQRCodesAsHTML
};
