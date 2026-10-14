from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database import init_db
from api import products, boxes, assembly

# Создаём таблицы при запуске
init_db()

app = FastAPI(
    title="Box Scanner API",
    description="API для системы локации товаров на складе",
    version="1.0.0"
)

# CORS для доступа с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене укажи конкретный домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(products.router)
app.include_router(boxes.router)
app.include_router(assembly.router)


@app.get("/")
async def root():
    return {
        "message": "Box Scanner API",
        "version": "1.0.0",
        "endpoints": {
            "products": "/api/products",
            "boxes": "/api/boxes",
            "assembly": "/api/assembly",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
