import os
import threading
import time
import logging
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Importación de funciones de módulos internos
from modelo.chat_functions import extract_keywords, generate_response
from modelo.procesar_imagen import download_image, save_temp_image, upload_to_gemini, clean_temp_file
from config import model

# Cargar variables de entorno
load_dotenv()

# Configuración de la aplicación Flask y CORS
app = Flask(__name__)
CORS(app)

# Configuración del logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route('/ping', methods=['GET'])
def ping():
    """
    Endpoint simple para mantener la aplicación activa.
    Este endpoint se utiliza internamente para evitar que la instancia se hiberne.
    """
    return jsonify({"status": "alive"}), 200


@app.route('/process_image', methods=['POST'])
def process_image_endpoint():
    """
    Endpoint para procesar imágenes.

    Recibe un JSON con la clave 'image_url', descarga y guarda la imagen temporalmente,
    la sube a Gemini y envía una solicitud al modelo para analizar la imagen en busca de
    información sobre plantas. Si no se detectan plantas, responde 'no hay plantas'.
    """
    data = request.get_json() or {}
    image_url = data.get("image_url", "").strip()

    if not image_url:
        return jsonify({'error': 'No se encontró URL de imagen.'}), 400

    temp_file_path = None
    try:
        # Descargar y guardar la imagen de forma temporal
        image = download_image(image_url)
        temp_file_path = save_temp_image(image)

        # Subir la imagen a Gemini
        uploaded_file = upload_to_gemini(genai, temp_file_path, mime_type="image/png")

        # Configurar el historial del chat para analizar la imagen
        chat_history = [{
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
            ]
        }]

        # Iniciar el chat con el modelo
        chat_session = model.start_chat(history=chat_history)
        response_message = chat_session.send_message(
            "Describe la imagen de forma breve con la información solicitada. Si no hay plantas, responde 'no hay plantas'."
        )
        response_text = response_message.text

        # Verificar si la respuesta indica que no se detectaron plantas
        if "no hay plantas" in response_text.lower() or "no puedo identificar" in response_text.lower():
            return jsonify({'respuesta': "no hay plantas"})

        return jsonify({'respuesta': response_text})

    except Exception as e:
        logger.error(f"Error al procesar la imagen: {str(e)}", exc_info=True)
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

    finally:
        # Eliminar el archivo temporal, incluso si ocurre un error
        if temp_file_path:
            try:
                clean_temp_file(temp_file_path)
            except Exception as cleanup_error:
                logger.error(f"Error limpiando el archivo temporal: {cleanup_error}", exc_info=True)


@app.route("/chat", methods=["POST"])
def chat_endpoint():
    """
    Endpoint para manejar solicitudes de chat.

    Recibe un JSON con 'message' y 'user'. Extrae palabras clave, consulta el historial
    (almacenado en Firebase) y genera una respuesta especializada en el cuidado de plantas.
    """
    data = request.get_json() or {}
    user_message = data.get("message", "").strip()
    user_name = data.get("user", "").strip()

    if not user_message:
        return jsonify({"error": "El mensaje del usuario no puede estar vacío."}), 400

    try:
        # Extraer palabras clave del mensaje del usuario
        topic_keywords = extract_keywords(user_message, model)
        # Generar respuesta basada en el mensaje, historial y palabras clave
        response_text = generate_response(user_message, user_name, topic_keywords, model)

        logger.info(f"Usuario: {user_name}, Mensaje: {user_message}, Respuesta: {response_text}")
        return jsonify({"response": response_text})
    except Exception as e:
        logger.error(f"Error en la solicitud de chat: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error en la solicitud de chat: {str(e)}"}), 500


def keep_alive():
    """
    Función que realiza un self-ping periódico para mantener activa la instancia.
    Se realiza una solicitud GET al endpoint /ping cada 5 minutos (300 segundos).
    """
    while True:
        try:
            # La URL se obtiene desde una variable de entorno o se usa la predeterminada.
            url = os.getenv("SELF_PING_URL", "http://localhost:5000/ping")
            response = requests.get(url)
            logger.info("Self-ping exitoso, estado: %s", response.status_code)
        except Exception as e:
            logger.error("Error durante el self-ping: %s", e)
        time.sleep(300)  # Espera 5 minutos antes del siguiente ping


def start_keep_alive_thread():
    """
    Inicia un hilo en segundo plano que ejecuta la función keep_alive.
    """
    thread = threading.Thread(target=keep_alive, daemon=True)
    thread.start()


if __name__ == "__main__":
    # Inicia el hilo de self-ping para mantener la instancia activa.
    start_keep_alive_thread()

    # Se utiliza el puerto definido en las variables de entorno o el puerto 5000 por defecto.
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
