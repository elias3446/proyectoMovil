import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import google.generativeai as genai
import logging

# Cargar las variables de entorno
load_dotenv()

# Inicializar Firebase solo si no ha sido inicializado previamente
if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_PATH'))
    firebase_admin.initialize_app(cred)

# Acceder a Firestore
db = firestore.client()

# Configuración del registro de interacciones
logger = logging.getLogger(__name__)

def extract_keywords(message, model):
    """Extrae palabras clave del mensaje utilizando la API de Google Generative AI."""
    if not message.strip():
        return ["Mensaje vacío"]
    try:
        prompt = f"Extrae las palabras clave del siguiente mensaje:\n{message}\n\nPalabras clave:"
        response = model.generate_content(prompt)
        return response.text.strip().split(", ")
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
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error al generar respuesta: {e}")
        return "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo."


def get_extended_history_from_firebase(user_name):
    """Obtiene todo el historial de mensajes de un usuario desde Firebase Firestore."""
    try:
        # Obtener el historial completo de la colección "messages" del usuario
        messages_ref = db.collection('users').document(user_name).collection('messages')
        docs = messages_ref.order_by('timestamp').get()  # Sin límite de mensajes

        history = []
        for doc in docs:
            history.append(doc.to_dict())

        return history
    except Exception as e:
        logger.error(f"Error al obtener historial extendido de Firebase: {e}")
        return []

def build_context_from_history(history, topic_keywords):
    """Construye el contexto para el modelo basado en el historial y las palabras clave."""
    context = ""
    for entry in history:
        if "text" in entry and "sender" in entry:
            context += f"{entry['sender']}: {entry['text']}\n"
    return context
