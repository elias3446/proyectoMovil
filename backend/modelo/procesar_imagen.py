"""
Funciones para el procesamiento de imágenes:
  - Descarga una imagen desde una URL.
  - Guarda la imagen en un directorio temporal.
  - Sube el archivo a Gemini.
  - Elimina archivos temporales.
"""

import os
import logging
import requests
import io
from PIL import Image
from typing import Optional, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def download_image(image_url: str) -> Image.Image:
    """
    Descarga una imagen desde una URL y retorna un objeto PIL Image.

    Args:
        image_url (str): URL de la imagen.

    Returns:
        Image.Image: Objeto de imagen.

    Raises:
        ValueError: Si la imagen no se puede descargar o procesar.
    """
    response = requests.get(image_url, stream=True)
    if response.status_code != 200:
        raise ValueError("No se pudo descargar la imagen.")
    try:
        image = Image.open(io.BytesIO(response.content))
        image.verify()  # Verifica la integridad de la imagen
        # Reabrir la imagen ya que verify() puede cerrar el archivo
        image = Image.open(io.BytesIO(response.content))
        return image
    except Exception as e:
        raise ValueError("Error al procesar la imagen descargada.") from e


def save_temp_image(image: Image.Image, filename: str = "uploaded_image.png") -> str:
    """
    Guarda la imagen en un directorio temporal y retorna la ruta del archivo.

    Args:
        image (Image.Image): Objeto de imagen a guardar.
        filename (str, opcional): Nombre del archivo. Por defecto, 'uploaded_image.png'.

    Returns:
        str: Ruta completa del archivo temporal.
    """
    temp_dir = os.path.join(os.getcwd(), "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, filename)
    image.save(temp_file_path)
    logger.info(f"Imagen guardada temporalmente en: {temp_file_path}")
    return temp_file_path


def upload_to_gemini(model: Any, path: str, mime_type: Optional[str] = None) -> Any:
    """
    Sube un archivo a Gemini utilizando la API del modelo generativo.

    Args:
        model (Any): Instancia del modelo generativo.
        path (str): Ruta del archivo a subir.
        mime_type (Optional[str]): Tipo MIME del archivo (por ejemplo, 'image/png').

    Returns:
        Any: Objeto que representa el archivo subido.

    Raises:
        FileNotFoundError: Si el archivo no existe.
        Exception: Si ocurre un error durante la subida.
    """
    if not os.path.exists(path):
        error_msg = f"La ruta especificada no existe: {path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    try:
        file = model.upload_file(path, mime_type=mime_type)
        logger.info(f"Archivo subido '{file.display_name}' a: {file.uri}")
        return file
    except Exception as e:
        logger.error("Error al subir el archivo a Gemini", exc_info=True)
        raise


def clean_temp_file(file_path: str) -> None:
    """
    Elimina un archivo temporal si existe.

    Args:
        file_path (str): Ruta del archivo a eliminar.

    Raises:
        Exception: Si ocurre un error al eliminar el archivo.
    """
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            logger.info(f"Archivo temporal eliminado: {file_path}")
        except Exception as e:
            logger.error(f"Error al eliminar el archivo temporal: {file_path}", exc_info=True)
            raise
    else:
        logger.warning(f"El archivo temporal no existe: {file_path}")
