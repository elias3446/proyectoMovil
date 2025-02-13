"""
Módulo para el procesamiento de solicitudes de chat y manejo de historial en Firebase.
Este módulo se encarga de:
  - Inicializar Firebase y obtener el cliente de Firestore.
  - Procesar la solicitud de chat extrayendo palabras clave y generando respuestas mediante un modelo generativo.
  - Obtener el historial de mensajes desde Firestore y construir el contexto para la generación de respuesta.
"""

import os
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore

# =============================================================================
# Configuración y carga de variables de entorno
# =============================================================================
load_dotenv()

# Configuración básica del logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# Inicialización de Firebase y obtención del cliente Firestore
# =============================================================================
def init_firestore() -> Any:
    """
    Inicializa Firebase usando las credenciales definidas en la variable de entorno
    FIREBASE_CREDENTIALS_PATH y retorna el cliente de Firestore.
    
    Returns:
        firestore.Client: Cliente de Firestore si la inicialización fue exitosa, o None en caso de error.
    """
    firebase_credentials_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
    if not firebase_credentials_path:
        logger.error("No se encontró la ruta de credenciales de Firebase en las variables de entorno.")
        return None

    try:
        # Verificar que el archivo de credenciales exista
        if not os.path.exists(firebase_credentials_path):
            raise FileNotFoundError(f"El archivo de credenciales no existe: {firebase_credentials_path}")
        # Inicializar Firebase solo si no ha sido inicializado previamente
        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_credentials_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase inicializado correctamente.")
    except Exception as e:
        logger.error(f"Error al inicializar Firebase: {e}", exc_info=True)
        return None

    try:
        return firestore.client()
    except Exception as e:
        logger.error("Error al acceder a Firestore.", exc_info=True)
        return None

# Cliente global de Firestore (puede ser None si ocurre algún error)
db = init_firestore()

# =============================================================================
# Funciones de procesamiento del chat
# =============================================================================
def process_chat_request(model, user_message: str, user_name: str) -> str:
    """
    Procesa la solicitud de chat:
      1. Extrae palabras clave del mensaje del usuario.
      2. Genera una respuesta usando el modelo generativo.

    Args:
        user_message (str): Mensaje del usuario.
        user_name (str): Nombre del usuario.
        model (Any): Instancia del modelo generativo.

    Returns:
        str: Respuesta generada por el modelo.
    """
    # Extraer palabras clave del mensaje
    topic_keywords = extract_keywords(model, user_message)
    # Generar respuesta basada en el mensaje, el historial y las palabras clave
    response_text = generate_response(model, user_message, user_name, topic_keywords)
    logger.info(f"Usuario: {user_name}, Mensaje: {user_message}, Respuesta: {response_text}")
    return response_text

def extract_keywords(model, message: str) -> List[str]:
    """
    Extrae palabras clave del mensaje utilizando la API de Google Generative AI.

    Args:
        message (str): Mensaje del cual extraer palabras clave.
        model (Any): Instancia del modelo generativo.

    Returns:
        List[str]: Lista de palabras clave extraídas.
    """
    if not message.strip():
        return ["Mensaje vacío"]
    try:
        prompt = f"Extrae las palabras clave del siguiente mensaje:\n{message}\n\nPalabras clave:"
        response = model.generate_content(prompt)
        # Verificar que la respuesta tenga atributo 'text' y contenga contenido
        text = getattr(response, 'text', None)
        if text:
            keywords = [keyword.strip() for keyword in text.split(",") if keyword.strip()]
            return keywords if keywords else ["Sin palabras clave detectadas"]
        else:
            return ["Sin palabras clave detectadas"]
    except Exception as e:
        logger.error(f"Error al extraer palabras clave: {e}", exc_info=True)
        return ["Error al extraer palabras clave"]

def build_context_from_history(history: List[Dict[str, Any]], topic_keywords: List[str]) -> str:
    """
    Construye el contexto para el prompt del modelo basado en el historial y las palabras clave.

    Args:
        history (List[Dict[str, Any]]): Historial de mensajes del usuario.
        topic_keywords (List[str]): Palabras clave extraídas del mensaje.

    Returns:
        str: Contexto construido para el prompt.
    """
    context_lines = []
    if history:
        for entry in history:
            sender = entry.get('sender', 'Desconocido')
            text = entry.get('text', '')
            if text:
                context_lines.append(f"{sender}: {text}")
    else:
        context_lines.append("No hay historial disponible.")

    if topic_keywords:
        keywords_context = "Palabras clave relevantes: " + ", ".join(topic_keywords)
        context_lines.append(keywords_context)

    return "\n".join(context_lines)

def build_dalia_prompt(context: str, message: str) -> str:
    """
    Construye el prompt para la generación de respuesta de DALIA.

    Args:
        context (str): Contexto obtenido a partir del historial y palabras clave.
        message (str): Mensaje actual del usuario.

    Returns:
        str: Prompt completo para el modelo generativo.
    """
    return (
        "Eres DALIA, una asistente experta y exclusiva en el cuidado de plantas. "
        "Tu único rol es ayudar en temas relacionados con el mantenimiento, salud, crecimiento y cuidado de las plantas. "
        "Nunca debes salir de este rol. Si la pregunta no está relacionada con el cuidado de plantas o jardinería, "
        "responde amablemente que solo puedes ayudar en temas de plantas.\n\n"
        "Contexto relevante del historial:\n"
        f"{context}\n\n"
        "Mensaje del usuario:\n"
        f"{message}\n\n"
        "Responde de manera concisa y precisa, manteniéndote siempre en tu rol de DALIA, la asistente especializada en el cuidado de plantas:"
    )

def generate_response(model, message: str, user_name: str, topic_keywords: List[str]) -> str:
    """
    Genera una respuesta especializada en el cuidado de plantas utilizando el modelo generativo,
    basándose en el mensaje del usuario, su historial y las palabras clave extraídas.

    Args:
        message (str): Mensaje del usuario.
        user_name (str): Nombre del usuario para identificar su historial.
        topic_keywords (List[str]): Lista de palabras clave extraídas del mensaje.
        model (Any): Instancia del modelo generativo.

    Returns:
        str: Respuesta generada o mensaje de error en caso de fallo.
    """
    if not message.strip():
        return "Por favor, escribe tu consulta sobre el cuidado de plantas para que pueda ayudarte."

    # Recuperar historial de mensajes desde Firestore
    history = get_extended_history_from_firebase(user_name)
    # Construir el contexto combinando historial y palabras clave
    context = build_context_from_history(history, topic_keywords)
    prompt = build_dalia_prompt(context, message)

    try:
        response = model.generate_content(prompt)
        text = getattr(response, 'text', None)
        if text:
            return text.strip()
        else:
            return "No pude generar una respuesta en este momento."
    except Exception as e:
        logger.error(f"Error al generar respuesta: {e}", exc_info=True)
        return "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo."

def get_extended_history_from_firebase(user_name: str) -> List[Dict[str, Any]]:
    """
    Obtiene el historial completo de mensajes de un usuario desde Firebase Firestore.

    Args:
        user_name (str): Nombre del usuario.

    Returns:
        List[Dict[str, Any]]: Lista de mensajes del historial o una lista vacía en caso de error.
    """
    if db is None:
        logger.error("Firestore no está disponible.")
        return []
    try:
        messages_ref = db.collection('users').document(user_name).collection('messages')
        docs = messages_ref.order_by('timestamp').get()
        history = [doc.to_dict() for doc in docs]
        if not history:
            logger.info(f"No se encontró historial para el usuario: {user_name}")
        return history
    except Exception as e:
        logger.error(f"Error al obtener historial extendido de Firebase para el usuario {user_name}: {e}", exc_info=True)
        return []
