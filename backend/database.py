from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Путь к базе данных
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "scanner.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# SQLite connection
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Модели
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    article = Column(String, unique=True, index=True, nullable=False)
    name = Column(Text, nullable=False)
    barcode_manufacturer = Column(String, index=True)  # ШК производителя
    barcode_ozon = Column(String, index=True)  # ШК Ozon (OZN...)
    ozon_id = Column(String)  # Ozon Product ID
    source = Column(String, default="manual")  # ozon | supplier | manual
    created_at = Column(DateTime, default=datetime.utcnow)

    box_items = relationship("BoxItem", back_populates="product")


class Box(Base):
    __tablename__ = "boxes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)  # BOX-001
    qr_code = Column(Text)  # base64 QR image
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("BoxItem", back_populates="box")


class BoxItem(Base):
    __tablename__ = "box_items"

    id = Column(Integer, primary_key=True, index=True)
    box_id = Column(Integer, ForeignKey("boxes.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)

    box = relationship("Box", back_populates="items")
    product = relationship("Product", back_populates="box_items")


class AssemblyList(Base):
    __tablename__ = "assembly_lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active")  # active | completed

    items = relationship("AssemblyItem", back_populates="assembly_list")


class AssemblyItem(Base):
    __tablename__ = "assembly_items"

    id = Column(Integer, primary_key=True, index=True)
    assembly_list_id = Column(Integer, ForeignKey("assembly_lists.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity_needed = Column(Integer, nullable=False)
    ozon_label = Column(String)  # Этикетка из сборочного листа (9200, 9201...)
    picked = Column(Integer, default=0)  # 0 = не собрано, 1 = собрано

    assembly_list = relationship("AssemblyList", back_populates="items")
    product = relationship("Product")


# Создание таблиц
def init_db():
    Base.metadata.create_all(bind=engine)


# Dependency для получения сессии
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
