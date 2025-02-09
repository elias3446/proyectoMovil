"""
config.py

Configuración del modelo generativo con Google Generative AI.
Este módulo se encarga de:
  - Cargar las variables de entorno.
  - Validar que la API_KEY esté configurada.
  - Configurar la API de Generative AI.
  - Definir la configuración de generación.
  - Crear y exponer una instancia del modelo generativo.
"""

import os
import logging
from typing import Dict
import google.generativeai as genai
from dotenv import load_dotenv

# Configuración básica del logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_configuration() -> None:
    """
    Carga las variables de entorno desde el archivo .env.
    """
    load_dotenv()
    logger.info("Variables de entorno cargadas correctamente.")


def get_api_key() -> str:
    """
    Obtiene la API Key desde las variables de entorno.
    
    Returns:
        str: La API Key configurada.
    
    Raises:
        ValueError: Si la API Key no se encuentra en las variables de entorno.
    """
    api_key = os.getenv("API_KEY")
    if not api_key:
        error_msg = "La API_KEY no se ha configurado en las variables de entorno."
        logger.error(error_msg)
        raise ValueError(error_msg)
    logger.info("API_KEY obtenida correctamente.")
    return api_key


def configure_genai(api_key: str) -> None:
    """
    Configura la API de Generative AI utilizando la API Key proporcionada.
    
    Args:
        api_key (str): La API Key para la configuración.
    """
    genai.configure(api_key=api_key)
    logger.info("API de Generative AI configurada correctamente.")


def get_generation_config() -> Dict[str, object]:
    """
    Define y retorna la configuración de generación para el modelo generativo.
    
    Returns:
        Dict[str, object]: Configuración con parámetros de generación.
    """
    config = {
        "temperature": 2,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
        "response_mime_type": "text/plain",
    }
    logger.info("Configuración de generación definida: %s", config)
    return config


def create_model() -> genai.GenerativeModel:
    """
    Crea y retorna una instancia del modelo generativo utilizando la configuración definida.
    
    Returns:
        genai.GenerativeModel: Instancia del modelo generativo.
    """
    generation_config = get_generation_config()
    model_instance = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config,
    )
    logger.info("Modelo generativo '%s' creado exitosamente.", "gemini-1.5-flash")
    return model_instance

# Secuencia de inicialización de la configuración
load_configuration()
api_key = get_api_key()
configure_genai(api_key)
model = create_model()
