import base64
import os
from flask import Flask, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv
from flask_cors import CORS
import io
import logging
from PIL import Image
from modelo.chat_functions import extract_keywords, generate_response
from modelo.procesar_imagen import upload_to_gemini, eliminar_prefijo_base64, clean_temp_file
from config import model  

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app)  # Habilita CORS para todas las rutas

# Configuración del registro de interacciones
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ruta para procesar imágenes
@app.route('/process_image', methods=['POST'])
def process_image():
    data = request.json.get("image")
    
    if not data:
        return jsonify({'error': 'No se encontró imagen en base64'}), 400

    try:
        # Eliminar el prefijo Base64 de la cadena
        data = eliminar_prefijo_base64(data)  # Usar la función importada

        # Decodificar la cadena base64
        image_data = base64.b64decode(data)

        # Crear una imagen desde los datos binarios decodificados
        image = Image.open(io.BytesIO(image_data))

        # Guardar la imagen como un archivo temporal
        temp_file_path = os.path.join('temp', 'uploaded_image.png')
        os.makedirs('temp', exist_ok=True)
        image.save(temp_file_path)

        # Procesar la imagen con Gemini
        uploaded_file = upload_to_gemini(genai, temp_file_path, mime_type="image/png")
        
        chat_session = model.start_chat(
            history=[{
                "role": "user",
                "parts": [
                    uploaded_file,
                    "¿Qué ves en esta imagen?"
                ],
            }]
        )

        response = chat_session.send_message("¿Qué hay en la imagen?")

        # Limpiar el archivo temporal solo si se procesó correctamente
        clean_temp_file(temp_file_path)  # Usar la función importada

        return jsonify({'respuesta': response.text})

    except Exception as e:
        logger.error(f"Error al procesar la imagen: {str(e)}")
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

# Ruta para manejar solicitudes de chat
@app.route("/chat", methods=["POST"])
def chat():
    """Punto final para manejar las solicitudes de chat."""
    data = request.json
    user_message = data.get("message", "")
    user_name = data.get("user", "")
    
    if not user_message:
        return jsonify({"error": "El mensaje del usuario no puede estar vacío."}), 400

    # Extraer las palabras clave del mensaje del usuario (opcional)
    topic_keywords = extract_keywords(user_message, model)
    
    # Generar la respuesta usando el historial y el modelo
    response = generate_response(user_message, user_name, topic_keywords, model)

    # Log de la interacción
    logger.info(f"Usuario: {user_name}, Mensaje: {user_message}, Respuesta: {response}")
    
    return jsonify({"response": response})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))  # Usar 5000 como valor predeterminado
    app.run(host="0.0.0.0", port=port)
