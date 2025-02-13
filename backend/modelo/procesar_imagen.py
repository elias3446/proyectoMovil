import os
import logging
from typing import Optional, Any
import requests
from PIL import Image
import io

# Configuración del logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def process_image_flow(image_url: str, model: Any) -> str:
    """
    Ejecuta el flujo completo para procesar una imagen:
      1. Descarga la imagen desde la URL.
      2. Guarda la imagen de forma temporal.
      3. Sube la imagen a Gemini.
      4. Inicia una conversación con el modelo para analizar la imagen.
      5. Envía un mensaje al chat y retorna la respuesta generada.

    Args:
        image_url (str): URL de la imagen a procesar.
        model (Any): Instancia del modelo generativo.

    Returns:
        str: Respuesta del bot tras analizar la imagen.

    Raises:
        Exception: Si ocurre algún error durante el proceso.
    """
    temp_file_path = None
    try:
        # Descargar la imagen desde la URL
        image = download_image(image_url)

        # Guardar la imagen en un archivo temporal
        temp_file_path = save_temp_image(image)

        # Subir la imagen a Gemini (usando mime_type "image/png")
        uploaded_file = upload_to_gemini(model, temp_file_path, mime_type="image/png")

        # Iniciar una conversación con el modelo, enviando la imagen y una instrucción
        chat_session = model.start_chat(
            history=[{
                "role": "user",
                "parts": [
                    uploaded_file,
                    (
                        "Analiza esta imagen y proporciona información concisa sobre las plantas. "
                        "La respuesta debe ser corta e incluir únicamente lo siguiente:\n"
                        "1. Tipo de planta.\n"
                        "2. Frecuencia de riego recomendada.\n"
                        "3. Tipo de tierra adecuado.\n"
                        "4. Cantidad de luz solar.\n"
                        "5. Otros datos relevantes.\n"
                        "Si la imagen no contiene ninguna planta, responde únicamente 'no hay plantas'."
                    )
                ],
            }]
        )

        # Enviar mensaje de solicitud y obtener la respuesta
        response_message = chat_session.send_message(
            "Describe la imagen de forma breve con la información solicitada. Si no hay plantas, responde 'no hay plantas'."
        )
        return response_message.text

    finally:
        # Asegurarse de limpiar el archivo temporal, si fue creado
        if temp_file_path:
            try:
                clean_temp_file(temp_file_path)
            except Exception as cleanup_error:
                logger.error("Error al limpiar el archivo temporal: %s", cleanup_error, exc_info=True)


def download_image(image_url: str) -> Image.Image:
    """
    Descarga una imagen a partir de una URL y retorna un objeto PIL Image.

    Args:
        image_url (str): URL de la imagen a descargar.

    Returns:
        Image.Image: Objeto de imagen descargado.

    Raises:
        ValueError: Si la descarga falla o el contenido no es una imagen válida.
    """
    response = requests.get(image_url, stream=True)
    if response.status_code != 200:
        raise ValueError("No se pudo descargar la imagen.")
    try:
        # Abrir la imagen desde el contenido descargado
        image = Image.open(io.BytesIO(response.content))
        # Verificar que el contenido sea una imagen válida
        image.verify()
        # Reabrir la imagen, ya que verify() puede cerrar el archivo
        image = Image.open(io.BytesIO(response.content))
        return image
    except Exception as e:
        raise ValueError("Error al procesar la imagen descargada.") from e


def save_temp_image(image: Image.Image, filename: str = "uploaded_image.png") -> str:
    """
    Guarda una imagen en un archivo temporal y retorna la ruta del archivo.

    Args:
        image (Image.Image): Objeto de imagen a guardar.
        filename (str, optional): Nombre del archivo. Por defecto "uploaded_image.png".

    Returns:
        str: Ruta del archivo temporal.
    """
    temp_dir = os.path.join(os.getcwd(), "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, filename)
    image.save(temp_file_path)
    logger.info("Imagen guardada temporalmente en: %s", temp_file_path)
    return temp_file_path


def upload_to_gemini(model: Any, path: str, mime_type: Optional[str] = None) -> Any:
    """
    Sube el archivo especificado a Gemini utilizando el modelo provisto.

    Consulta https://ai.google.dev/gemini-api/docs/prompting_with_media para más detalles.

    Args:
        model (Any): Instancia del modelo generativo configurado para la API de Gemini.
        path (str): Ruta del archivo que se desea subir.
        mime_type (Optional[str]): Tipo MIME del archivo (ejemplo: 'image/png').

    Returns:
        Any: Objeto que representa el archivo subido, incluyendo propiedades como 'display_name' y 'uri'.

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
        logger.info("Archivo subido '%s' correctamente. URI: %s", file.display_name, file.uri)
        return file
    except Exception as e:
        logger.error("Error al subir el archivo a Gemini.", exc_info=True)
        raise


def clean_temp_file(file_path: str) -> None:
    """
    Elimina el archivo temporal especificado.

    Args:
        file_path (str): Ruta del archivo a eliminar.

    Raises:
        Exception: Si ocurre un error al eliminar el archivo.
    """
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            logger.info("Archivo temporal eliminado: %s", file_path)
        except Exception as e:
            logger.error("Error al eliminar el archivo temporal: %s", file_path, exc_info=True)
            raise
    else:
        logger.warning("El archivo temporal no existe: %s", file_path)
