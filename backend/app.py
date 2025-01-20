import os
from flask import Flask, request, jsonify
from modelo.procesar_imagen import upload_to_gemini
from modelo.chatbot import interactuar_con_gemini
import google.generativeai as genai
from dotenv import load_dotenv
from flask_cors import CORS  # Importar CORS
import base64
from io import BytesIO
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

# Función auxiliar para procesar imágenes base64
def process_base64_image(data):
    # Eliminar el prefijo "data:image/png;base64," o "data:image/jpeg;base64,"
    prefix_png = "data:image/png;base64,"
    prefix_jpeg = "data:image/jpeg;base64,"
    if data.startswith(prefix_png):
        data = data[len(prefix_png):]
    elif data.startswith(prefix_jpeg):
        data = data[len(prefix_jpeg):]

    # Decodificar la cadena base64
    image_data = base64.b64decode(data)

    # Crear una imagen desde los datos binarios decodificados
    return Image.open(BytesIO(image_data))

# Función auxiliar para interactuar con el modelo Gemini
def interact_with_model(uploaded_file, message="¿Qué ves en esta imagen?", history=None):
    # Si hay un historial de chat, incluirlo
    if history is None:
        history = [{"role": "user", "parts": [uploaded_file, message]}]
    
    # Iniciar la sesión con el historial y el mensaje
    chat_session = model.start_chat(history=history)
    response = chat_session.send_message(message)

    return response.text

# Ruta para procesar imágenes
@app.route('/process_image', methods=['POST'])
def process_image():
    data = request.json.get("image")
    
    if not data:
        return jsonify({'error': 'No se encontró imagen en base64'}), 400

    try:
        # Procesar la imagen
        image = process_base64_image(data)

        # Guardar la imagen como un archivo temporal
        temp_file_path = os.path.join('temp', 'uploaded_image.png')
        os.makedirs('temp', exist_ok=True)
        image.save(temp_file_path)

        # Subir la imagen a Gemini
        uploaded_file = upload_to_gemini(genai, temp_file_path, mime_type="image/png")
        
        # Interactuar con el modelo utilizando la función común
        response = interact_with_model(uploaded_file)

        # Limpiar el archivo temporal
        clean_temp_file(temp_file_path)

        return jsonify({'respuesta': response})

    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

# Ruta para el chat normal
@app.route('/chat', methods=['POST'])
def chat():
    entrada = request.json.get("mensaje")
    historial = request.json.get("historial")  # Historial completo del chat

    if not entrada:
        return jsonify({'error': 'No se proporcionó un mensaje'}), 400

    try:
        # Función auxiliar para formatear el historial
        def format_history(historial):
            return [{"role": msg["role"], "parts": [{"text": msg["content"]}]} for msg in historial]

        # Formatear el historial
        formatted_history = format_history(historial)

        # Interactuar con el modelo utilizando la función común
        response = interact_with_model(uploaded_file=None, message=entrada, history=formatted_history)

        return jsonify({'respuesta': response})
    except Exception as e:
        return jsonify({'error': f'Error al generar respuesta: {str(e)}'}), 500


if __name__ == "__main__":
    # Render proporciona el puerto en la variable de entorno PORT
    port = int(os.getenv("PORT", 5000))  # Usar 5000 como valor predeterminado
    app.run(host="0.0.0.0", port=port)
