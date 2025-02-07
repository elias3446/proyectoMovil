import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import google.generativeai as genai
import logging

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
        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_credentials_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase inicializado correctamente.")
    except Exception as e:
        logger.error(f"Error al inicializar Firebase: {e}")

# Acceder a Firestore
db = firestore.client()

def extract_keywords(message, model):
    """Extrae palabras clave del mensaje utilizando la API de Google Generative AI."""
    if not message.strip():
        return ["Mensaje vacío"]
    try:
        prompt = f"Extrae las palabras clave del siguiente mensaje:\n{message}\n\nPalabras clave:"
        response = model.generate_content(prompt)
        return response.text.strip().split(", ") if response.text else ["Sin palabras clave detectadas"]
    except Exception as e:
        logger.error(f"Error al extraer palabras clave: {e}")
        return ["Error al extraer palabras clave"]

def generate_response(message, user_name, topic_keywords, model):
    """Genera una respuesta especializada en el cuidado de plantas, utilizando el modelo basado en el mensaje, el historial y las palabras clave."""
    
    # Recuperar el historial de Firebase
    history = get_extended_history_from_firebase(user_name)
    
    # Construir el contexto con el historial
    context = build_context_from_history(history, topic_keywords)
    
    if not message.strip():
        return "Por favor, escribe tu consulta sobre el cuidado de plantas para que pueda ayudarte."

    # Construir el prompt para el modelo
    try:
        prompt = f"""
        Eres un asistente experto en el cuidado de plantas. Solo puedes responder preguntas relacionadas con el mantenimiento, salud y crecimiento de las plantas. 
        Si la pregunta no está relacionada con plantas, responde educadamente que solo puedes ayudar en temas de jardinería y cuidado de plantas.

        Contexto relevante del historial:
        {context}

        Mensaje del usuario:
        {message}

        Respuesta (mantente siempre en el papel de asistente de cuidado de plantas):
        """
        response = model.generate_content(prompt)
        return response.text.strip() if response.text else "No pude generar una respuesta en este momento."
    except Exception as e:
        logger.error(f"Error al generar respuesta: {e}")
        return "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo."

def get_extended_history_from_firebase(user_name):
    """Obtiene todo el historial de mensajes de un usuario desde Firebase Firestore."""
    try:
        messages_ref = db.collection('users').document(user_name).collection('messages')
        docs = messages_ref.order_by('timestamp').get()

        history = [doc.to_dict() for doc in docs]
        return history if history else []
    except Exception as e:
        logger.error(f"Error al obtener historial extendido de Firebase: {e}")
        return []

def build_context_from_history(history, topic_keywords):
    """Construye el contexto para el modelo basado en el historial y las palabras clave."""
    context = "\n".join(f"{entry['sender']}: {entry['text']}" for entry in history if "text" in entry and "sender" in entry)
    return context or "No hay historial disponible."
