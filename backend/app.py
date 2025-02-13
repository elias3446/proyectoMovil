import os
import logging
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from dotenv import load_dotenv

# Importar funciones y modelos del proyecto
from modelo.chat_functions import extract_keywords, generate_response, process_chat_request
from modelo.procesar_imagen import upload_to_gemini, clean_temp_file, download_image, save_temp_image, process_image_flow

# Cargar variables de entorno
load_dotenv()

# Configurar logging para toda la aplicación
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# Blueprints para modularizar los endpoints
# =============================================================================

# Blueprint para endpoints de procesamiento de imágenes
image_bp = Blueprint('image_bp', __name__)

@image_bp.route('/process_image', methods=['POST'])
def process_image_endpoint():
    """
    Endpoint para procesar imágenes.
    
    Recibe un JSON con la clave 'image_url', descarga y procesa la imagen usando Gemini,
    y retorna una respuesta. Si no se detectan plantas, retorna 'no hay plantas'.
    """
    data = request.get_json() or {}
    image_url = data.get("image_url", "").strip()
    
    if not image_url:
        return jsonify({'error': 'No se encontró URL de imagen.'}), 400

    try:
        # Procesar la imagen mediante el flujo definido en process_image_flow
        response_text = process_image_flow(image_url)
        
        # Verificar si la respuesta indica que no se detectaron plantas
        if "no hay plantas" in response_text.lower() or "no puedo identificar" in response_text.lower():
            return jsonify({'respuesta': "no hay plantas"})
        
        return jsonify({'respuesta': response_text})
    
    except Exception as e:
        logger.error(f"Error al procesar la imagen: {str(e)}", exc_info=True)
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

# Blueprint para endpoints de chat
chat_bp = Blueprint('chat_bp', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat_endpoint():
    """
    Endpoint para manejar solicitudes de chat.
    
    Recibe un JSON con 'message' y 'user', procesa el mensaje (por ejemplo, extrayendo palabras clave)
    y genera una respuesta utilizando el modelo.
    """
    data = request.get_json() or {}
    user_message = data.get("message", "").strip()
    user_name = data.get("user", "").strip()
    
    if not user_message:
        return jsonify({"error": "El mensaje del usuario no puede estar vacío."}), 400
    
    try:
        # Procesar la solicitud de chat mediante process_chat_request
        response_text = process_chat_request(user_message, user_name)
        return jsonify({"response": response_text})
    except Exception as e:
        logger.error(f"Error en la solicitud de chat: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error en la solicitud de chat: {str(e)}"}), 500

# =============================================================================
# Función fábrica para crear y configurar la aplicación Flask
# =============================================================================

def create_app():
    """
    Función fábrica que crea y configura la aplicación Flask.
    
    Permite una mayor modularidad, reutilización y facilita el testeo de la aplicación.
    """
    app = Flask(__name__)
    
    # Habilitar CORS para todas las rutas
    CORS(app)
    
    # Registrar los blueprints creados anteriormente
    app.register_blueprint(image_bp)
    app.register_blueprint(chat_bp)
    
    return app

# =============================================================================
# Ejecución de la aplicación
# =============================================================================

if __name__ == "__main__":
    # Crear la aplicación Flask utilizando la función fábrica
    app = create_app()
    
    # Obtener el puerto desde las variables de entorno o usar el puerto 5000 por defecto
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
