import os
import logging
from typing import Optional, Any
import requests
from PIL import Image
import io

# Configurar el logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def download_image(image_url: str) -> Image.Image:
    """
    Descarga una imagen a partir de una URL y retorna un objeto PIL Image.
    Lanza ValueError si la descarga falla o el contenido no es una imagen válida.
    """
    response = requests.get(image_url, stream=True)
    if response.status_code != 200:
        raise ValueError("No se pudo descargar la imagen.")
    try:
        image = Image.open(io.BytesIO(response.content))
        # Verificar que el contenido sea una imagen
        image.verify()
        # Reabrir la imagen (verify() puede cerrar el archivo)
        image = Image.open(io.BytesIO(response.content))
        return image
    except Exception as e:
        raise ValueError("Error al procesar la imagen descargada.") from e


def save_temp_image(image: Image.Image, filename: str = "uploaded_image.png") -> str:
    """
    Guarda la imagen en un archivo temporal y retorna la ruta del archivo.
    """
    temp_dir = os.path.join(os.getcwd(), "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, filename)
    image.save(temp_file_path)
    return temp_file_path

def upload_to_gemini(model: Any, path: str, mime_type: Optional[str] = None) -> Any:
    """
    Sube el archivo dado a Gemini.
    
    Consulta https://ai.google.dev/gemini-api/docs/prompting_with_media para más detalles.
    
    Args:
        model (Any): Instancia del modelo generativo configurado para la API de Gemini.
        path (str): Ruta del archivo que se desea subir.
        mime_type (Optional[str]): Tipo MIME del archivo (por ejemplo, 'image/png'). Es opcional.
    
    Returns:
        Any: Objeto que representa el archivo subido, que debe incluir propiedades como 'display_name' y 'uri'.
    
    Raises:
        FileNotFoundError: Si la ruta proporcionada no existe.
        Exception: Si ocurre un error durante la subida del archivo.
    """
    if not os.path.exists(path):
        error_msg = f"La ruta especificada no existe: {path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    try:
        file = model.upload_file(path, mime_type=mime_type)
        logger.info(f"Archivo subido '{file.display_name}' como: {file.uri}")
        return file
    except Exception as e:
        logger.error("Error al subir el archivo a Gemini", exc_info=True)
        raise

def clean_temp_file(file_path: str) -> None:
    """
    Elimina el archivo temporal si existe.
    
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
