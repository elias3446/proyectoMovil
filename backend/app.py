import os
from flask import Flask, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv
from flask_cors import CORS
import io
import logging
from PIL import Image
import requests
from modelo.chat_functions import extract_keywords, generate_response
from modelo.procesar_imagen import upload_to_gemini, clean_temp_file
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
    image_url = request.json.get("image_url")
    
    if not image_url:
        return jsonify({'error': 'No se encontró URL de imagen'}), 400

    try:
        # Descargar la imagen desde la URL
        response = requests.get(image_url)
        if response.status_code != 200:
            return jsonify({'error': 'No se pudo descargar la imagen'}), 400
        
        # Crear una imagen desde los datos descargados
        image = Image.open(io.BytesIO(response.content))

        # Guardar la imagen como un archivo temporal
        temp_file_path = os.path.join('temp', 'uploaded_image.png')
        os.makedirs('temp', exist_ok=True)
        image.save(temp_file_path)

        # Procesar la imagen con Gemini
        uploaded_file = upload_to_gemini(genai, temp_file_path, mime_type="image/png")
        
        # Iniciar una conversación con el modelo enfocada en el análisis detallado de plantas
        chat_session = model.start_chat(
            history=[{
                "role": "user",
                "parts": [
                    uploaded_file,
                    "Analiza esta imagen y proporciona información detallada sobre las plantas. Me gustaría saber lo siguiente:\n"
                    "1. El tipo de planta que aparece.\n"
                    "2. La frecuencia de riego actual recomendada.\n"
                    "3. El tipo de tierra que parece ser más adecuado.\n"
                    "4. La cantidad de luz solar que recibe la planta.\n"
                    "5. Cualquier otro dato relevante que pueda ayudarme a cuidar mejor estas plantas."
                ],
            }]
        )
        
        response = chat_session.send_message(
            "Describe la imagen con la información sobre el tipo de plantas, su frecuencia de riego, tipo de tierra, cantidad de luz solar y cualquier otro detalle relevante para el cuidado. Si no es una planta, por favor indícalo y recuerda que solo puedes detectar plantas."
        )

        # Respuesta para el caso en que no haya plantas en la imagen
        if "no hay plantas" in response.text.lower() or "no puedo identificar" in response.text.lower():
            return jsonify({'respuesta': "Lo siento, parece que la imagen no contiene plantas. Solo puedo ayudarte a identificar y cuidar plantas."})

        # Limpiar el archivo temporal después del procesamiento
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
