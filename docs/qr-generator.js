// QR Code генерация в браузере с ПРАВИЛЬНОЙ ЭТИКЕТКОЙ

function generateQRCode(text, size = 300) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');

        QRCode.toCanvas(canvas, text, {
            width: size,
            margin: 2,
            errorCorrectionLevel: 'H'
        }, (error) => {
            if (error) {
                reject(error);
                return;
            }

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

// ✅ НОВАЯ ФУНКЦИЯ: Скачать все QR-коды как ЭТИКЕТКИ (PDF с правильным форматом)
async function downloadQRCodesAsPDF(boxes) {
    // Используем jsPDF
    const { jsPDF } = window.jspdf;
    
    // Создаём PDF в формате A4 для печати этикеток
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;   // 210 мм
    const pageHeight = doc.internal.pageSize.height; // 297 мм
    
    // Размер этикетки: 100x70 мм (стандартная наклейка)
    const labelWidth = 100;
    const labelHeight = 70;
    const margin = 5; // отступ от края
    
    // Сколько этикеток в ряду
    const labelsPerRow = Math.floor((pageWidth - margin) / (labelWidth + margin));
    
    let labelIndex = 0;
    let pageIndex = 0;

    for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        
        // Вычисляем позицию на странице
        const rowOnPage = Math.floor((labelIndex % (Math.floor((pageHeight - margin) / (labelHeight + margin)) * labelsPerRow)) / labelsPerRow);
        const colOnPage = labelIndex % labelsPerRow;
        
        // Если этикетка не влезает на страницу - создаём новую
        if (labelIndex > 0 && (labelIndex % (Math.floor((pageHeight - margin) / (labelHeight + margin)) * labelsPerRow)) === 0) {
            doc.addPage();
            pageIndex++;
            rowOnPage = 0;
            colOnPage = 0;
        }
        
        const x = margin + colOnPage * (labelWidth + margin);
        const y = margin + rowOnPage * (labelHeight + margin);

        // ===== РИСУЕМ ЭТИКЕТКУ =====
        
        // Чёрный прямоугольник вокруг (рамка)
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(x, y, labelWidth, labelHeight);

        // НОМЕР КОРОБКИ СВЕРХУ (крупный и жирный)
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(box.code, x + labelWidth / 2, y + 8, { align: 'center' });

        // QR-код (по центру, ниже номера)
        const qrSize = 40; // размер QR в мм
        const qrX = x + (labelWidth - qrSize) / 2;
        const qrY = y + 15;
        doc.addImage(box.qr, 'PNG', qrX, qrY, qrSize, qrSize);

        // Дополнительный текст внизу (маленький шрифт)
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, x + 2, y + labelHeight - 3);

        labelIndex++;
    }

    doc.save('box-qr-labels.pdf');
}

// ✅ НОВАЯ ФУНКЦИЯ: Скачать как HTML для предпросмотра перед печатью
function downloadQRCodesAsHTML(boxes) {
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Этикетки коробок</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            padding: 5mm;
            background: #f0f0f0;
        }
        
        .page {
            width: 210mm;
            height: 297mm;
            background: white;
            padding: 5mm;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 5mm;
            break-after: page;
            page-break-after: always;
            margin: 0 auto 10mm;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .label {
            width: 100mm;
            height: 70mm;
            border: 2px solid #000;
            padding: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .label-code {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            word-break: break-all;
            line-height: 1.2;
        }
        
        .label-qr {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .label-qr img {
            max-width: 50mm;
            max-height: 50mm;
            image-rendering: pixelated;
        }
        
        .label-date {
            font-size: 8px;
            color: #666;
            text-align: center;
            width: 100%;
        }
        
        @media print {
            body {
                padding: 0;
                background: white;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    ${generatePagesHTML(boxes)}
    
    <script>
        console.log('Для печати: File → Print → Выбери принтер → Печать');
        console.log('Убедись что в настройках принтера:');
        console.log('- Размер бумаги: A4');
        console.log('- Ориентация: Портретная');
        console.log('- Поля: Нет/Минимальные');
        console.log('- Масштаб: 100%');
    </script>
</body>
</html>
    `;
    
    // Сохраняем HTML в файл
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
    let labelsPerPage = 4; // 2 в ряду × 2 в столбце для листа A4
    
    for (let i = 0; i < boxes.length; i += labelsPerPage) {
        html += '<div class="page">';
        
        for (let j = 0; j < labelsPerPage && (i + j) < boxes.length; j++) {
            const box = boxes[i + j];
            html += `
            <div class="label">
                <div class="label-code">${box.code}</div>
                <div class="label-qr">
                    <img src="${box.qr}" alt="${box.code}">
                </div>
                <div class="label-date">Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
            </div>
            `;
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
    downloadHTML: downloadQRCodesAsHTML  // ✅ НОВЫЙ метод
};
