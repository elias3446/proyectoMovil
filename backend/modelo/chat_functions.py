import os
import logging
from typing import List, Dict, Any
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import google.generativeai as genai

# Cargar las variables de entorno
load_dotenv()

# Configuración del registro de interacciones
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar Firebase solo si no ha sido inicializado previamente
firebase_credentials_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
if not firebase_credentials_path:
    logger.error("No se encontró la ruta de credenciales de Firebase en las variables de entorno.")
else:
    try:
        # Verificar que el archivo de credenciales exista
        if not os.path.exists(firebase_credentials_path):
            raise FileNotFoundError(f"El archivo de credenciales no existe: {firebase_credentials_path}")
        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_credentials_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase inicializado correctamente.")
    except Exception as e:
        logger.error(f"Error al inicializar Firebase: {e}", exc_info=True)

# Acceder a Firestore (si la inicialización fue exitosa)
try:
    db = firestore.client()
except Exception as e:
    logger.error("Error al acceder a Firestore.", exc_info=True)
    db = None


def extract_keywords(message: str, model: Any) -> List[str]:
    """
    Extrae palabras clave del mensaje utilizando la API de Google Generative AI.

    Args:
        message (str): El mensaje del cual extraer palabras clave.
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
            keywords = [keyword.strip() for keyword in response.text.split(",") if keyword.strip()]
            return keywords if keywords else ["Sin palabras clave detectadas"]
        else:
            return ["Sin palabras clave detectadas"]
    except Exception as e:
        logger.error(f"Error al extraer palabras clave: {e}", exc_info=True)
        return ["Error al extraer palabras clave"]


def generate_response(message: str, user_name: str, topic_keywords: List[str], model: Any) -> str:
    """
    Genera una respuesta especializada en el cuidado de plantas, utilizando el modelo
    basado en el mensaje, el historial y las palabras clave.

    Args:
        message (str): Mensaje del usuario.
        user_name (str): Nombre del usuario (para identificar su historial).
        topic_keywords (List[str]): Lista de palabras clave extraídas del mensaje.
        model (Any): Instancia del modelo generativo.

    Returns:
        str: Respuesta generada o mensaje de error en caso de fallo.
    """
    if not message.strip():
        return "Por favor, escribe tu consulta sobre el cuidado de plantas para que pueda ayudarte."

    # Recuperar el historial de Firebase
    history = get_extended_history_from_firebase(user_name)

    # Construir el contexto con el historial y las palabras clave
    context = build_context_from_history(history, topic_keywords)

    try:
        prompt = (
            "Eres DALIA, una asistente experta y exclusiva en el cuidado de plantas. "
            "Tu único rol es ayudar en temas relacionados con el mantenimiento, salud, crecimiento y cuidado de las plantas. "
            "Nunca debes salir de este rol. Si la pregunta no está relacionada con el cuidado de plantas o jardinería, "
            "responde amablemente que solo puedes ayudar en temas de plantas.\n\n"
            "Contexto relevante del historial:\n"
            f"{context}\n\n"
            "Mensaje del usuario:\n"
            f"{message}\n\n"
            "Responde de manera detallada y precisa, manteniéndote siempre en tu rol de DALIA, la asistente especializada en el cuidado de plantas:"
            )

        response = model.generate_content(prompt)
        if response and hasattr(response, 'text') and response.text:
            return response.text.strip()
        else:
            return "No pude generar una respuesta en este momento."
    except Exception as e:
        logger.error(f"Error al generar respuesta: {e}", exc_info=True)
        return "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo."


def get_extended_history_from_firebase(user_name: str) -> List[Dict[str, Any]]:
    """
    Obtiene todo el historial de mensajes de un usuario desde Firebase Firestore.

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


def build_context_from_history(history: List[Dict[str, Any]], topic_keywords: List[str]) -> str:
    """
    Construye el contexto para el modelo basado en el historial y opcionalmente en las palabras clave.

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
        # Se añade un resumen de las palabras clave si no están ya presentes en el contexto
        keywords_context = "Palabras clave relevantes: " + ", ".join(topic_keywords)
        context_lines.append(keywords_context)

    return "\n".join(context_lines)
