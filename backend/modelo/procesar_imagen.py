import os
import google.generativeai as genai

def upload_to_gemini(model, path, mime_type=None):
    """Sube el archivo dado a Gemini.
    
    Consulta https://ai.google.dev/gemini-api/docs/prompting_with_media
    """
    file = model.upload_file(path, mime_type=mime_type)
    print(f"Archivo subido '{file.display_name}' como: {file.uri}")
    return file

def clean_temp_file(file_path):
    """Elimina el archivo temporal si existe."""
    if os.path.exists(file_path):
        os.remove(file_path)
