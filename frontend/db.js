// IndexedDB для хранения данных в браузере
const DB_NAME = 'BoxScannerDB';
const DB_VERSION = 1;

let db = null;

// Инициализация БД
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Таблица товаров
            if (!db.objectStoreNames.contains('products')) {
                const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
                productStore.createIndex('article', 'article', { unique: true });
                productStore.createIndex('barcode_manufacturer', 'barcode_manufacturer', { unique: false });
                productStore.createIndex('barcode_ozon', 'barcode_ozon', { unique: false });
            }

            // Таблица коробок
            if (!db.objectStoreNames.contains('boxes')) {
                const boxStore = db.createObjectStore('boxes', { keyPath: 'id', autoIncrement: true });
                boxStore.createIndex('code', 'code', { unique: true });
            }

            // Таблица содержимого коробок
            if (!db.objectStoreNames.contains('box_items')) {
                const itemStore = db.createObjectStore('box_items', { keyPath: 'id', autoIncrement: true });
                itemStore.createIndex('box_id', 'box_id', { unique: false });
                itemStore.createIndex('product_id', 'product_id', { unique: false });
                itemStore.createIndex('box_product', ['box_id', 'product_id'], { unique: true });
            }

            // Таблица сборочных листов
            if (!db.objectStoreNames.contains('assembly_lists')) {
                const assemblyStore = db.createObjectStore('assembly_lists', { keyPath: 'id', autoIncrement: true });
                assemblyStore.createIndex('created_at', 'created_at', { unique: false });
            }
        };
    });
}

// === ТОВАРЫ ===

async function addProduct(productData) {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    try {
        const id = await store.add(productData);
        await tx.complete;
        return id;
    } catch (error) {
        if (error.name === 'ConstraintError') {
            // Товар уже существует, обновляем
            return await updateProductByArticle(productData.article, productData);
        }
        throw error;
    }
}

async function updateProductByArticle(article, updates) {
    const product = await getProductByArticle(article);
    if (!product) return null;

    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    const updated = { ...product, ...updates };
    await store.put(updated);
    await tx.complete;
    return updated.id;
}

async function getProductByBarcode(barcode) {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');

    // Ищем по штрихкоду производителя
    let index = store.index('barcode_manufacturer');
    let product = await index.get(barcode);

    if (!product) {
        // Ищем по штрихкоду Ozon
        index = store.index('barcode_ozon');
        product = await index.get(barcode);
    }

    return product;
}

async function getProductByArticle(article) {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const index = store.index('article');
    return await index.get(article);
}

async function getAllProducts() {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    return await store.getAll();
}

async function getProductsCount() {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    return await store.count();
}

// === КОРОБКИ ===

async function createBox(code) {
    const tx = db.transaction('boxes', 'readwrite');
    const store = tx.objectStore('boxes');

    const box = {
        code: code,
        created_at: new Date().toISOString()
    };

    const id = await store.add(box);
    await tx.complete;
    return { id, ...box };
}

async function getBoxByCode(code) {
    const tx = db.transaction('boxes', 'readonly');
    const store = tx.objectStore('boxes');
    const index = store.index('code');
    return await index.get(code);
}

async function getAllBoxes() {
    const tx = db.transaction('boxes', 'readonly');
    const store = tx.objectStore('boxes');
    return await store.getAll();
}

async function getBoxesCount() {
    const tx = db.transaction('boxes', 'readonly');
    const store = tx.objectStore('boxes');
    return await store.count();
}

// === СОДЕРЖИМОЕ КОРОБОК ===

async function addItemToBox(boxId, productId, quantity) {
    const tx = db.transaction('box_items', 'readwrite');
    const store = tx.objectStore('box_items');

    // Проверяем есть ли уже такой товар в коробке
    const index = store.index('box_product');
    const existing = await index.get([boxId, productId]);

    if (existing) {
        // Увеличиваем количество
        existing.quantity += quantity;
        await store.put(existing);
        await tx.complete;
        return existing;
    } else {
        // Добавляем новый
        const item = {
            box_id: boxId,
            product_id: productId,
            quantity: quantity,
            added_at: new Date().toISOString()
        };
        const id = await store.add(item);
        await tx.complete;
        return { id, ...item };
    }
}

async function getBoxItems(boxId) {
    const tx = db.transaction(['box_items', 'products'], 'readonly');
    const itemStore = tx.objectStore('box_items');
    const productStore = tx.objectStore('products');

    const index = itemStore.index('box_id');
    const items = await index.getAll(boxId);

    // Подгружаем информацию о товарах
    const result = [];
    for (const item of items) {
        const product = await productStore.get(item.product_id);
        result.push({
            ...item,
            product: product
        });
    }

    return result;
}

async function findBoxesByProduct(productId) {
    const tx = db.transaction(['box_items', 'boxes'], 'readonly');
    const itemStore = tx.objectStore('box_items');
    const boxStore = tx.objectStore('boxes');

    const index = itemStore.index('product_id');
    const items = await index.getAll(productId);

    // Подгружаем информацию о коробках
    const result = [];
    for (const item of items) {
        const box = await boxStore.get(item.box_id);
        result.push({
            ...item,
            box: box
        });
    }

    return result;
}

// === ЭКСПОРТ/ИМПОРТ ===

async function exportDatabase() {
    const data = {
        version: DB_VERSION,
        exported_at: new Date().toISOString(),
        products: await getAllProducts(),
        boxes: await getAllBoxes(),
        box_items: await getAllBoxItems()
    };

    return JSON.stringify(data, null, 2);
}

async function getAllBoxItems() {
    const tx = db.transaction('box_items', 'readonly');
    const store = tx.objectStore('box_items');
    return await store.getAll();
}

async function importDatabase(jsonData) {
    const data = JSON.parse(jsonData);

    // Очищаем БД
    await clearDatabase();

    // Импортируем товары
    for (const product of data.products) {
        const { id, ...productData } = product;
        await addProduct(productData);
    }

    // Импортируем коробки
    for (const box of data.boxes) {
        const { id, ...boxData } = box;
        await createBox(boxData.code);
    }

    // Импортируем содержимое коробок
    for (const item of data.box_items) {
        const box = await getBoxByCode(data.boxes.find(b => b.id === item.box_id)?.code);
        if (box) {
            await addItemToBox(box.id, item.product_id, item.quantity);
        }
    }

    return {
        products: data.products.length,
        boxes: data.boxes.length,
        items: data.box_items.length
    };
}

async function clearDatabase() {
    const tx = db.transaction(['products', 'boxes', 'box_items'], 'readwrite');
    await tx.objectStore('products').clear();
    await tx.objectStore('boxes').clear();
    await tx.objectStore('box_items').clear();
    await tx.complete;
}

// Экспорт функций
window.DB = {
    init: initDB,
    products: {
        add: addProduct,
        getByBarcode: getProductByBarcode,
        getByArticle: getProductByArticle,
        getAll: getAllProducts,
        count: getProductsCount
    },
    boxes: {
        create: createBox,
        getByCode: getBoxByCode,
        getAll: getAllBoxes,
        count: getBoxesCount,
        getItems: getBoxItems,
        addItem: addItemToBox
    },
    search: {
        findBoxesByProduct: findBoxesByProduct
    },
    export: exportDatabase,
    import: importDatabase,
    clear: clearDatabase
};
