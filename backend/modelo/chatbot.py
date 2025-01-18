def interactuar_con_gemini(model, mensaje):
    """Envía un mensaje a la API de Gemini y devuelve la respuesta."""
    try:
        respuesta = model.generate_content(mensaje)
        texto_respuesta = respuesta.text
        return texto_respuesta
    except Exception as e:
        print(f"Error al interactuar con la API de Gemini: {e}")
        return "Lo siento, hubo un problema al procesar tu solicitud."