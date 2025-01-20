import os
from flask import Flask, request, jsonify
from modelo.procesar_imagen import upload_to_gemini
from modelo.chatbot import interactuar_con_gemini
import google.generativeai as genai
from dotenv import load_dotenv
from flask_cors import CORS  # Importar CORS
import base64
import io
from PIL import Image

# Cargar variables de entorno
load_dotenv()

# Configurar la API de Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise EnvironmentError("La clave de API de Gemini no se encuentra configurada en las variables de entorno.")

genai.configure(api_key=api_key)

# Configuración del modelo de generación
generation_config = {
    "temperature": 2,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

# Crear el modelo
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)

app = Flask(__name__)

# Habilitar CORS para todas las rutas
CORS(app)  # Esto habilita CORS para todas las rutas

# Función auxiliar para eliminar archivos temporales
def clean_temp_file(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)

# Ruta para procesar imágenes
@app.route('/process_image', methods=['POST'])
def process_image():
    data = request.json.get('image_base64')
    if not data:
        return jsonify({'error': 'No se proporcionó una imagen en formato base64'}), 400

    try:
        image_data = base64.b64decode(data)
        image = Image.open(io.BytesIO(image_data))

        # Convertir a RGB si la imagen tiene un canal alfa (RGBA)
        if image.mode == 'RGBA':
            image = image.convert('RGB')

        temp_file_path = os.path.join('temp', 'uploaded_image.jpg')
        os.makedirs('temp', exist_ok=True)
        image.save(temp_file_path, format='JPEG')

        uploaded_file = upload_to_gemini(genai, temp_file_path, mime_type="image/jpg")
        
        chat_session = model.start_chat(
            history=[
                {
                    "role": "user",
                    "parts": [
                        uploaded_file,
                        "¿Sabes qué planta es esta? ¿Qué enfermedad tiene?",
                    ],
                }
            ]
        )

        response = chat_session.send_message("¿Cómo puedo cuidar esta planta?")
        return jsonify({'respuesta': response.text})
    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500
    finally:
        clean_temp_file(temp_file_path)

# Ruta para el chat normal
@app.route('/chat', methods=['POST'])
def chat():
    entrada = request.json.get("mensaje")
    if not entrada:
        return jsonify({'error': 'No se proporcionó un mensaje'}), 400

    try:
        respuesta = interactuar_con_gemini(model, entrada)
        return jsonify({'respuesta': respuesta})
    except Exception as e:
        return jsonify({'error': f'Error al generar respuesta: {str(e)}'}), 500

if __name__ == "__main__":
    # Render proporciona el puerto en la variable de entorno PORT
    port = int(os.getenv("PORT", 5000))  # Usar 5000 como valor predeterminado
    app.run(host="0.0.0.0", port=port)
