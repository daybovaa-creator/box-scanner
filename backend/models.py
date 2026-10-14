from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Products
class ProductBase(BaseModel):
    article: str
    name: str
    barcode_manufacturer: Optional[str] = None
    barcode_ozon: Optional[str] = None
    ozon_id: Optional[str] = None
    source: str = "manual"


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Boxes
class BoxBase(BaseModel):
    code: str


class BoxCreate(BoxBase):
    pass


class Box(BoxBase):
    id: int
    qr_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Box Items
class BoxItemBase(BaseModel):
    box_id: int
    product_id: int
    quantity: int


class BoxItemCreate(BaseModel):
    article: str  # Вместо product_id используем артикул
    quantity: int


class BoxItemResponse(BaseModel):
    id: int
    quantity: int
    product: Product
    added_at: datetime

    class Config:
        from_attributes = True


class BoxWithItems(Box):
    items: List[BoxItemResponse] = []


# Assembly Lists
class AssemblyListCreate(BaseModel):
    name: str


class AssemblyList(BaseModel):
    id: int
    name: str
    created_at: datetime
    status: str

    class Config:
        from_attributes = True


class AssemblyItemCreate(BaseModel):
    article: str
    quantity_needed: int
    ozon_label: Optional[str] = None


class AssemblyItemResponse(BaseModel):
    id: int
    quantity_needed: int
    ozon_label: Optional[str]
    picked: bool
    product: Product

    class Config:
        from_attributes = True


# Search Response
class SearchByBarcodeResponse(BaseModel):
    product: Product
    locations: List[dict]  # [{"box_code": "BOX-001", "quantity": 5}, ...]


# Assembly Route
class AssemblyRouteBox(BaseModel):
    box_code: str
    box_id: int
    items: List[dict]  # [{"article": "...", "name": "...", "quantity": 5, "ozon_label": "9200"}]


class AssemblyRouteResponse(BaseModel):
    boxes: List[AssemblyRouteBox]
    not_found: List[str]  # Артикулы которые не найдены
