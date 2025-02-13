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
from typing import Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv

# Configuración básica del logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_env_variables() -> None:
    """
    Carga las variables de entorno desde el archivo .env.
    """
    load_dotenv()
    logger.info("Variables de entorno cargadas correctamente.")

def fetch_api_key() -> str:
    """
    Obtiene y valida la API_KEY desde las variables de entorno.
    
    Returns:
        str: La API_KEY configurada.
    
    Raises:
        ValueError: Si la API_KEY no está configurada.
    """
    api_key = os.getenv("API_KEY")
    if not api_key:
        error_msg = "La API_KEY no se ha configurado en las variables de entorno."
        logger.error(error_msg)
        raise ValueError(error_msg)
    logger.info("API_KEY obtenida correctamente.")
    return api_key

def setup_genai(api_key: str) -> None:
    """
    Configura la API de Generative AI utilizando la API_KEY proporcionada.
    
    Args:
        api_key (str): La API_KEY para la configuración.
    """
    genai.configure(api_key=api_key)
    logger.info("API de Generative AI configurada correctamente.")

def generation_configuration() -> Dict[str, Any]:
    """
    Define y retorna la configuración de generación para el modelo generativo.
    
    Returns:
        Dict[str, Any]: Configuración con parámetros de generación.
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

def instantiate_model() -> genai.GenerativeModel:
    """
    Crea y retorna una instancia del modelo generativo utilizando la configuración definida.
    
    Returns:
        genai.GenerativeModel: Instancia del modelo generativo.
    """
    config = generation_configuration()
    model_instance = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=config,
    )
    logger.info("Modelo generativo '%s' creado exitosamente.", "gemini-1.5-flash")
    return model_instance

def initialize_model() -> genai.GenerativeModel:
    """
    Inicializa la configuración del modelo generativo:
      1. Carga las variables de entorno.
      2. Obtiene y valida la API_KEY.
      3. Configura la API de Generative AI.
      4. Crea y retorna la instancia del modelo.
    
    Returns:
        genai.GenerativeModel: Modelo generativo inicializado.
    """
    load_env_variables()
    api_key = fetch_api_key()
    setup_genai(api_key)
    return instantiate_model()

# Inicialización del modelo al cargar el módulo.
model = initialize_model()
