import os
from flask import Flask, request, jsonify
from modelo.procesar_imagen import upload_to_gemini
import google.generativeai as genai
from dotenv import load_dotenv
from flask_cors import CORS  # Importar CORS
import base64
import io
import logging
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

# Configurar logging para capturar errores
logging.basicConfig(level=logging.DEBUG)

# Función auxiliar para eliminar archivos temporales
def clean_temp_file(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)

# Ruta para el chat
@app.route('/chat', methods=['POST'])
def chat():
    entrada = request.json.get("mensaje")
    historial = request.json.get("historial", [])

    if not entrada:
        return jsonify({'error': 'No se proporcionó un mensaje'}), 400

    try:
        # Incluir el mensaje actual en el historial
        historial.append({
            "role": "user",
            "parts": [entrada]  # Cambié 'content' por 'parts'
        })

        # Generar la respuesta utilizando el historial
        chat_session = model.start_chat(
            history=historial
        )

        # Obtener la respuesta del modelo
        respuesta = chat_session.send_message(entrada)

        # Actualizar el historial con la respuesta del assistant
        historial.append({
            "role": "assistant",
            "parts": [respuesta.text]  # Cambié 'content' por 'parts'
        })

        # Devolver solo la respuesta, no el historial completo
        return jsonify({'respuesta': respuesta.text})

    except Exception as e:
        # Registrar el error completo para diagnóstico
        logging.error(f"Error al procesar la solicitud: {str(e)}", exc_info=True)
        return jsonify({'error': f'Error al generar respuesta: {str(e)}'}), 500

if __name__ == "__main__":
    # Usar la variable de entorno PORT, si no se encuentra se asigna el valor 5000
    port = int(os.getenv("PORT", 5000))  # Usar 5000 como valor predeterminado
    app.run(host="0.0.0.0", port=port)
