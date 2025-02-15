import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
from modelo.chat_functions import extract_keywords, generate_response
from modelo.procesar_imagen import upload_to_gemini, clean_temp_file,download_image,save_temp_image
from config import model

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app)  # Habilita CORS para todas las rutas

# Configuración del registro de interacciones
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/process_image', methods=['POST'])
def process_image_endpoint():
    """
    Endpoint para procesar imágenes.
    
    Recibe en JSON la clave 'image_url', descarga y guarda la imagen, la procesa con Gemini
    y establece una conversación para obtener información sobre plantas. Si no se detectan plantas,
    retorna un mensaje informativo.
    """
    data = request.get_json() or {}
    image_url = data.get("image_url", "").strip()
    
    if not image_url:
        return jsonify({'error': 'No se encontró URL de imagen.'}), 400

    temp_file_path = None
    try:
        # Descargar y guardar la imagen en un archivo temporal
        image = download_image(image_url)
        temp_file_path = save_temp_image(image)

        # Procesar la imagen con Gemini
        uploaded_file = upload_to_gemini(genai, temp_file_path, mime_type="image/png")
        
        # Iniciar una conversación con el modelo enfocada en el análisis de plantas
        chat_session = model.start_chat(
            history=[{
                "role": "user",
                "parts": [
                    uploaded_file,
                    (
                        "Analiza esta imagen y proporciona información detallada sobre las plantas. Me gustaría saber lo siguiente:\n"
                        "1. El tipo de planta que aparece.\n"
                        "2. La frecuencia de riego actual recomendada.\n"
                        "3. El tipo de tierra que parece ser más adecuado.\n"
                        "4. La cantidad de luz solar que recibe la planta.\n"
                        "5. Cualquier otro dato relevante que pueda ayudarme a cuidar mejor estas plantas."
                    )
                ],
            }]
        )
        
        response_message = chat_session.send_message(
            "Describe la imagen con la información sobre el tipo de plantas, su frecuencia de riego, tipo de tierra, cantidad de luz solar y cualquier otro detalle relevante para el cuidado. Si no es una planta, por favor indícalo y recuerda que solo puedes detectar plantas."
        )
        response_text = response_message.text

        # Si la respuesta indica que no se detectaron plantas, se informa al usuario
        if "no hay plantas" in response_text.lower() or "no puedo identificar" in response_text.lower():
            return jsonify({'respuesta': "Lo siento, parece que la imagen no contiene plantas. Solo puedo ayudarte a identificar y cuidar plantas."})
        
        return jsonify({'respuesta': response_text})

    except Exception as e:
        logger.error(f"Error al procesar la imagen: {str(e)}", exc_info=True)
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

    finally:
        # Asegurarse de limpiar el archivo temporal, incluso en caso de error
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                clean_temp_file(temp_file_path)
            except Exception as cleanup_error:
                logger.error(f"Error limpiando el archivo temporal: {cleanup_error}", exc_info=True)


@app.route("/chat", methods=["POST"])
def chat_endpoint():
    """
    Endpoint para manejar solicitudes de chat.
    
    Recibe en JSON los campos 'message' y 'user'. Se valida que el mensaje no esté vacío,
    se extraen palabras clave (opcional) y se genera una respuesta utilizando el modelo.
    """
    data = request.get_json() or {}
    user_message = data.get("message", "").strip()
    user_name = data.get("user", "").strip()
    
    if not user_message:
        return jsonify({"error": "El mensaje del usuario no puede estar vacío."}), 400

    try:
        # Extraer palabras clave del mensaje del usuario (opcional)
        topic_keywords = extract_keywords(user_message, model)
        # Generar la respuesta utilizando el historial y el modelo
        response_text = generate_response(user_message, user_name, topic_keywords, model)

        # Registrar la interacción
        logger.info(f"Usuario: {user_name}, Mensaje: {user_message}, Respuesta: {response_text}")
        
        return jsonify({"response": response_text})
    except Exception as e:
        logger.error(f"Error en la solicitud de chat: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error en la solicitud de chat: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))  # Usa 5000 como valor predeterminado si no se encuentra PORT en las variables de entorno
    app.run(host="0.0.0.0", port=port)
