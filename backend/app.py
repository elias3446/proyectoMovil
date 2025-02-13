import os
import asyncio
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import httpx

# Importamos las funciones modulares (ajustándolas si es necesario para async)
from modelo.chat_functions import extract_keywords, generate_response
from modelo.procesar_imagen import download_image, save_temp_image, upload_to_gemini, clean_temp_file
from config import model

# Cargar variables de entorno
load_dotenv()

# Configuración de FastAPI y CORS
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajusta esto según tus necesidades de seguridad
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración del logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.get("/ping")
async def ping():
    """
    Endpoint simple para mantener la aplicación activa.
    """
    return {"status": "alive"}


@app.post("/process_image")
async def process_image_endpoint(request: Request):
    """
    Endpoint para procesar imágenes.

    Recibe un JSON con la clave 'image_url', descarga y guarda la imagen temporalmente,
    la sube a Gemini y envía una solicitud al modelo para analizar la imagen en busca de
    información sobre plantas.
    """
    data = await request.json()
    image_url = data.get("image_url", "").strip()

    if not image_url:
        raise HTTPException(status_code=400, detail="No se encontró URL de imagen.")

    temp_file_path = None
    try:
        # Descargar y guardar la imagen de forma sincrónica (puedes adaptar download_image para async)
        image = download_image(image_url)
        temp_file_path = save_temp_image(image)

        # Subir la imagen a Gemini (manteniendo la llamada síncrona o envolviéndola en un executor)
        uploaded_file = upload_to_gemini(model, temp_file_path, mime_type="image/png")

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

        chat_session = model.start_chat(history=chat_history)
        response_message = chat_session.send_message(
            "Describe la imagen de forma breve con la información solicitada. Si no hay plantas, responde 'no hay plantas'."
        )
        response_text = response_message.text

        if "no hay plantas" in response_text.lower() or "no puedo identificar" in response_text.lower():
            return JSONResponse(content={'respuesta': "no hay plantas"})

        return JSONResponse(content={'respuesta': response_text})

    except Exception as e:
        logger.error(f"Error al procesar la imagen: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error al procesar la imagen: {str(e)}")
    finally:
        if temp_file_path:
            try:
                clean_temp_file(temp_file_path)
            except Exception as cleanup_error:
                logger.error(f"Error limpiando el archivo temporal: {cleanup_error}", exc_info=True)


@app.post("/chat")
async def chat_endpoint(request: Request):
    """
    Endpoint para manejar solicitudes de chat.

    Recibe un JSON con 'message' y 'user'. Extrae palabras clave, consulta el historial
    y genera una respuesta especializada en el cuidado de plantas.
    """
    data = await request.json()
    user_message = data.get("message", "").strip()
    user_name = data.get("user", "").strip()

    if not user_message:
        raise HTTPException(status_code=400, detail="El mensaje del usuario no puede estar vacío.")

    try:
        topic_keywords = extract_keywords(user_message, model)
        response_text = generate_response(user_message, user_name, topic_keywords, model)

        logger.info(f"Usuario: {user_name}, Mensaje: {user_message}, Respuesta: {response_text}")
        return JSONResponse(content={"response": response_text})
    except Exception as e:
        logger.error(f"Error en la solicitud de chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error en la solicitud de chat: {str(e)}")


async def keep_alive():
    """
    Realiza un self-ping periódico para mantener la instancia activa.
    Se hace una solicitud GET al endpoint /ping cada 5 minutos.
    """
    async with httpx.AsyncClient() as client:
        while True:
            try:
                url = os.getenv("SELF_PING_URL", "http://localhost:8000/ping")
                response = await client.get(url)
                logger.info("Self-ping exitoso, estado: %s", response.status_code)
            except Exception as e:
                logger.error("Error durante el self-ping: %s", e)
            await asyncio.sleep(300)  # 5 minutos


# Inicia la tarea de self-ping cuando arranca la aplicación.
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(keep_alive())
