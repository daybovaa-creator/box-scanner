from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import get_db, AssemblyList as DBAssemblyList, AssemblyItem as DBAssemblyItem
from database import Product as DBProduct, BoxItem as DBBoxItem, Box as DBBox
from models import AssemblyList, AssemblyListCreate, AssemblyItemCreate, AssemblyRouteResponse

router = APIRouter(prefix="/api/assembly", tags=["assembly"])


@router.post("/", response_model=AssemblyList)
async def create_assembly_list(data: AssemblyListCreate, db: Session = Depends(get_db)):
    """
    Создать новый сборочный лист
    """
    assembly = DBAssemblyList(name=data.name)
    db.add(assembly)
    db.commit()
    db.refresh(assembly)
    return assembly


@router.post("/{assembly_id}/items")
async def add_items_to_assembly(
    assembly_id: int,
    items: List[AssemblyItemCreate],
    db: Session = Depends(get_db)
):
    """
    Добавить товары в сборочный лист
    """
    assembly = db.query(DBAssemblyList).filter(DBAssemblyList.id == assembly_id).first()
    if not assembly:
        raise HTTPException(status_code=404, detail="Сборочный лист не найден")

    added = 0
    not_found = []

    for item in items:
        # Находим товар по артикулу
        product = db.query(DBProduct).filter(DBProduct.article == item.article).first()
        if not product:
            not_found.append(item.article)
            continue

        # Добавляем в сборочный лист
        assembly_item = DBAssemblyItem(
            assembly_list_id=assembly_id,
            product_id=product.id,
            quantity_needed=item.quantity_needed,
            ozon_label=item.ozon_label
        )
        db.add(assembly_item)
        added += 1

    db.commit()

    return {
        "success": True,
        "added": added,
        "not_found": not_found
    }


@router.get("/{assembly_id}/route", response_model=AssemblyRouteResponse)
async def get_assembly_route(assembly_id: int, db: Session = Depends(get_db)):
    """
    Получить маршрут сборки (какие коробки нужно взять)
    """
    assembly = db.query(DBAssemblyList).filter(DBAssemblyList.id == assembly_id).first()
    if not assembly:
        raise HTTPException(status_code=404, detail="Сборочный лист не найден")

    # Получаем все товары из сборочного листа
    assembly_items = db.query(DBAssemblyItem).filter(
        DBAssemblyItem.assembly_list_id == assembly_id
    ).all()

    # Группируем по коробкам
    boxes_map = {}  # {box_id: {box_code, items: [...]}}
    not_found = []

    for asm_item in assembly_items:
        product = db.query(DBProduct).filter(DBProduct.id == asm_item.product_id).first()

        # Находим в каких коробках лежит этот товар
        box_items = db.query(DBBoxItem, DBBox).join(
            DBBox, DBBox.id == DBBoxItem.box_id
        ).filter(DBBoxItem.product_id == product.id).all()

        if not box_items:
            not_found.append(product.article)
            continue

        # Добавляем в каждую коробку где есть товар
        for box_item, box in box_items:
            if box.id not in boxes_map:
                boxes_map[box.id] = {
                    "box_code": box.code,
                    "box_id": box.id,
                    "items": []
                }

            boxes_map[box.id]["items"].append({
                "article": product.article,
                "name": product.name,
                "quantity_in_box": box_item.quantity,
                "quantity_needed": asm_item.quantity_needed,
                "ozon_label": asm_item.ozon_label
            })

    # Преобразуем в список
    boxes_list = list(boxes_map.values())

    return {
        "boxes": boxes_list,
        "not_found": not_found
    }


@router.patch("/{assembly_id}/items/{item_id}/pick")
async def mark_item_picked(assembly_id: int, item_id: int, db: Session = Depends(get_db)):
    """
    Отметить товар как собранный
    """
    item = db.query(DBAssemblyItem).filter(
        DBAssemblyItem.id == item_id,
        DBAssemblyItem.assembly_list_id == assembly_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден в сборочном листе")

    item.picked = 1
    db.commit()

    return {"success": True, "message": "Товар отмечен как собранный"}


@router.get("/{assembly_id}", response_model=AssemblyList)
async def get_assembly_list(assembly_id: int, db: Session = Depends(get_db)):
    """
    Получить сборочный лист
    """
    assembly = db.query(DBAssemblyList).filter(DBAssemblyList.id == assembly_id).first()
    if not assembly:
        raise HTTPException(status_code=404, detail="Сборочный лист не найден")
    return assembly


@router.get("/", response_model=List[AssemblyList])
async def list_assembly_lists(db: Session = Depends(get_db)):
    """
    Получить список всех сборочных листов
    """
    lists = db.query(DBAssemblyList).order_by(DBAssemblyList.created_at.desc()).all()
    return lists
