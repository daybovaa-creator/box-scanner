// Парсинг CSV от поставщика
async function parseSupplierCSV(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const products = [];

    // Пропускаем первые 6 строк (заголовки начинаются с 7-й строки)
    for (let i = 6; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Парсим CSV (учитываем кавычки)
        const cols = parseCSVLine(line);
        if (cols.length < 8) continue;

        const article = (cols[1] || '').trim(); // Колонка B
        const name = (cols[3] || '').trim();    // Колонка D
        const barcode = (cols[6] || '').trim(); // Колонка G

        if (!article) continue;

        // Конвертируем штрихкод если это число
        let barcodeStr = barcode;
        if (barcode && !isNaN(barcode)) {
            barcodeStr = String(parseInt(parseFloat(barcode)));
        }

        products.push({
            article: article,
            name: name,
            barcode_manufacturer: barcodeStr || null,
            barcode_ozon: null,
            ozon_id: null,
            source: 'supplier'
        });
    }

    return products;
}

// Парсинг CSV от Ozon
async function parseOzonCSV(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const products = [];

    // Ищем строку с заголовками
    let headerIndex = -1;
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        if (lines[i].includes('Артикул') && lines[i].includes('Наименование')) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) {
        throw new Error('Не найдены заголовки в CSV файле от Ozon');
    }

    // Парсим данные
    for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseCSVLine(line);
        if (cols.length < 4) continue;

        const article = (cols[0] || '').trim();
        const ozonId = (cols[1] || '').trim();
        const name = (cols[2] || '').trim();
        const barcode = (cols[3] || '').trim();

        if (!article) continue;

        // Конвертируем ID и штрихкод
        let ozonIdStr = ozonId;
        if (ozonId && !isNaN(ozonId)) {
            ozonIdStr = String(parseInt(parseFloat(ozonId)));
        }

        let barcodeStr = barcode;
        if (barcode && !isNaN(barcode)) {
            barcodeStr = String(parseInt(parseFloat(barcode)));
        }

        products.push({
            article: article,
            name: name,
            barcode_manufacturer: null,
            barcode_ozon: barcodeStr || null,
            ozon_id: ozonIdStr || null,
            source: 'ozon'
        });
    }

    return products;
}

// Парсинг строки CSV с учётом кавычек
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            // Если следующий символ тоже кавычка - это экранированная кавычка
            if (line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

// Экспорт функций
window.CSVParser = {
    parseSupplier: parseSupplierCSV,
    parseOzon: parseOzonCSV
};
