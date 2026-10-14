import qrcode
from io import BytesIO
import base64


def generate_qr_code(data: str) -> str:
    """
    Генерирует QR-код и возвращает его как base64 строку

    Args:
        data: Строка для кодирования (например, "BOX-001")

    Returns:
        Base64 строка с изображением QR-кода
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Конвертируем в base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return f"data:image/png;base64,{img_str}"
