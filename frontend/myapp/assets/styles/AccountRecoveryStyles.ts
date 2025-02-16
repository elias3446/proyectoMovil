export const styles = {
  // KeyboardAvoidingView:
  // • Layout: flex (flex-1)
  // • Alineación: justify-center, items-center
  // • Color: fondo blanco
  keyboardAvoidingView: "flex-1 justify-center items-center bg-white",

  // ScrollView:
  // • Tamaño: ancho completo (w-full)
  // • Color: fondo blanco
  scrollView: "w-full bg-white",

  // Container:
  // • Tamaño: ancho completo (w-full), ancho máximo (max-w-[25rem])
  // • Espaciado: padding horizontal (px-5) y margen superior (mt-10)
  // • Color: fondo blanco
  // • Forma: bordes redondeados (rounded-xl)
  // • Posición: relativo (relative)
  container: "w-full max-w-[25rem] px-5 mt-10 bg-white rounded-xl relative",

  // Title:
  // • Tipografía: fuente en negrita (font-bold), tamaño grande (text-3xl), color del texto (text-black)
  // • Alineación: centrado (text-center)
  // • Espaciado: margen inferior (mb-3)
  title: "font-bold text-3xl text-black text-center mb-3",

  // Subtitle:
  // • Tipografía: tamaño de texto (text-lg), color personalizado (text-[#666])
  // • Alineación: centrado (text-center)
  // • Espaciado: margen inferior (mb-5)
  subtitle: "text-lg text-[#666] text-center mb-5",

  // Email Container:
  // • Tamaño: ancho completo (w-full)
  // • Espaciado: margen inferior (mb-5)
  emailContainer: "w-full mb-5",

  // Email Label:
  // • Tipografía: fuente en negrita (font-bold), tamaño base (text-base), color del texto (text-black)
  // • Alineación: alineado a la izquierda (text-left)
  // • Espaciado: margen inferior (mb-2)
  emailLabel: "font-bold text-base text-black text-left mb-2",

  // Input Container:
  // • Layout: fila flexible (flex-row) y alineación vertical (items-center)
  // • Tamaño: ancho completo (w-full)
  // • Color: fondo personalizado (bg-[#F3F4F6])
  // • Forma: bordes redondeados (rounded-xl)
  // • Posición: relativo (relative)
  inputContainer: "flex-row items-center w-full bg-[#F3F4F6] rounded-xl relative",

  // Email Icon:
  // • Posición: absoluto (absolute), desplazado a la izquierda (left-3) y con orden z (z-20)
  emailIcon: "absolute left-3 z-20",

  // Email Input:
  // • Layout: ocupa el espacio disponible (flex-1)
  // • Tamaño: altura (h-11), padding izquierdo (pl-11) y derecho (pr-4)
  // • Tipografía: tamaño de texto (text-lg) y color (text-black)
  // • Color: fondo personalizado (bg-[#F3F4F6])
  // • Forma: bordes redondeados (rounded-xl)
  emailInput: "flex-1 h-11 pl-11 pr-4 text-lg text-black bg-[#F3F4F6] rounded-xl",

  // Buttons Container:
  // • Layout: fila flexible (flex-row) con distribución (justify-between)
  // • Tamaño: ancho completo (w-full)
  // • Espaciado: margen superior (mt-5)
  buttonsContainer: "flex-row justify-between w-full mt-5",

  // Cancel Button:
  // • Color: fondo personalizado gris (bg-[#CCCCCC])
  // • Espaciado: padding vertical (py-3) y horizontal (px-5)
  // • Forma: bordes redondeados (rounded-xl)
  // • Tamaño: ancho (w-[48%])
  // • Alineación: centra su contenido (items-center)
  cancelButton: "bg-[#CCCCCC] py-3 px-5 rounded-xl w-[48%] items-center",

  // Search Button:
  // • Color: fondo personalizado verde (bg-[#5CB868])
  // • Espaciado: padding vertical (py-3) y horizontal (px-5)
  // • Forma: bordes redondeados (rounded-xl)
  // • Tamaño: ancho (w-[48%])
  // • Alineación: centra su contenido (items-center)
  searchButton: "bg-[#5CB868] py-3 px-5 rounded-xl w-[48%] items-center",

  // Button Text:
  // • Tipografía: fuente en negrita (font-bold), tamaño de texto (text-lg), color blanco (text-white)
  // • Alineación: centrado (text-center)
  buttonText: "font-bold text-lg text-white text-center",
};
