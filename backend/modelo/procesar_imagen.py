import os
import google.generativeai as genai

def upload_to_gemini(model, path, mime_type=None):
    """Sube el archivo dado a Gemini.
    
    Consulta https://ai.google.dev/gemini-api/docs/prompting_with_media
    """
    file = model.upload_file(path, mime_type=mime_type)
    print(f"Archivo subido '{file.display_name}' como: {file.uri}")
    return file

def eliminar_prefijo_base64(data):
    """Elimina el prefijo base64 de una cadena de datos de imagen."""
    prefijos = [
        "data:image/png;base64,",
        "data:image/jpeg;base64,",
        "data:image/jpg;base64,"
    ]
    for prefijo in prefijos:
        if data.startswith(prefijo):
            return data[len(prefijo):]
    return data

def clean_temp_file(file_path):
    """Elimina el archivo temporal si existe."""
    if os.path.exists(file_path):
        os.remove(file_path)
