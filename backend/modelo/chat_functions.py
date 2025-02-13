"""
Funciones para el manejo del chat e integración con el modelo generativo.

Incluye:
  - Extracción de palabras clave del mensaje.
  - Generación de respuestas en base al historial y palabras clave.
  - Obtención y construcción de contexto a partir del historial de Firebase.
"""

import os
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv
import google.generativeai as genai

# Inicialización de Firebase
import firebase_admin
from firebase_admin import credentials, firestore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def initialize_firebase() -> Any:
    """
    Inicializa Firebase utilizando las credenciales definidas en FIREBASE_CREDENTIALS_PATH.
    
    Returns:
        firestore.Client: Cliente de Firestore o None si falla la inicialización.
    """
    firebase_credentials_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
    if not firebase_credentials_path:
        logger.error("No se encontró la ruta de credenciales de Firebase en las variables de entorno.")
        return None
    try:
        if not os.path.exists(firebase_credentials_path):
            raise FileNotFoundError(f"El archivo de credenciales no existe: {firebase_credentials_path}")
        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_credentials_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase inicializado correctamente.")
        return firestore.client()
    except Exception as e:
        logger.error(f"Error al inicializar Firebase: {e}", exc_info=True)
        return None


# Cliente de Firestore (singleton)
db = initialize_firebase()


def extract_keywords(message: str, model: Any) -> List[str]:
    """
    Extrae palabras clave del mensaje utilizando la API del modelo generativo.

    Args:
        message (str): Mensaje de entrada.
        model (Any): Instancia del modelo generativo.
        
    Returns:
        List[str]: Lista de palabras clave extraídas.
    """
    if not message.strip():
        return ["Mensaje vacío"]
    try:
        prompt = f"Extrae las palabras clave del siguiente mensaje:\n{message}\n\nPalabras clave:"
        response = model.generate_content(prompt)
        if response and hasattr(response, 'text') and response.text:
            keywords = [kw.strip() for kw in response.text.split(",") if kw.strip()]
            return keywords if keywords else ["Sin palabras clave detectadas"]
        return ["Sin palabras clave detectadas"]
    except Exception as e:
        logger.error(f"Error al extraer palabras clave: {e}", exc_info=True)
        return ["Error al extraer palabras clave"]


def get_extended_history_from_firebase(user_name: str) -> List[Dict[str, Any]]:
    """
    Obtiene el historial de mensajes de un usuario desde Firebase Firestore.

    Args:
        user_name (str): Nombre del usuario.
        
    Returns:
        List[Dict[str, Any]]: Lista de mensajes del historial.
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
        logger.error(f"Error al obtener historial de Firebase para {user_name}: {e}", exc_info=True)
        return []


def build_context_from_history(history: List[Dict[str, Any]], topic_keywords: List[str]) -> str:
    """
    Construye el contexto para el prompt basado en el historial y las palabras clave.

    Args:
        history (List[Dict[str, Any]]): Historial de mensajes.
        topic_keywords (List[str]): Lista de palabras clave.
        
    Returns:
        str: Contexto construido.
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


def generate_response(message: str, user_name: str, topic_keywords: List[str], model: Any) -> str:
    """
    Genera una respuesta especializada en el cuidado de plantas utilizando el modelo generativo.

    Args:
        message (str): Mensaje del usuario.
        user_name (str): Nombre del usuario.
        topic_keywords (List[str]): Palabras clave extraídas.
        model (Any): Instancia del modelo generativo.
        
    Returns:
        str: Respuesta generada.
    """
    if not message.strip():
        return "Por favor, escribe tu consulta sobre el cuidado de plantas para que pueda ayudarte."

    history = get_extended_history_from_firebase(user_name)
    context = build_context_from_history(history, topic_keywords)

    try:
        prompt = (
            "Eres DALIA, una asistente experta en el cuidado de plantas. "
            "Solo debes ayudar en temas relacionados con el mantenimiento, salud y crecimiento de plantas. "
            "Si la consulta no está relacionada, informa que solo puedes ayudar en temas de plantas.\n\n"
            "Contexto relevante del historial:\n"
            f"{context}\n\n"
            "Mensaje del usuario:\n"
            f"{message}\n\n"
            "Responde de manera detallada y precisa manteniéndote en el rol de DALIA:"
        )
        response = model.generate_content(prompt)
        if response and hasattr(response, 'text') and response.text:
            return response.text.strip()
        return "No pude generar una respuesta en este momento."
    except Exception as e:
        logger.error(f"Error al generar respuesta: {e}", exc_info=True)
        return "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo."
