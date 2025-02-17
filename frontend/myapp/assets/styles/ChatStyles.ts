export const styles = {
  // TypingIndicator Text:
  // • Tamaño de fuente: text-base
  // • Color del texto: text-gray-500
  typingIndicatorText: "text-base text-gray-500",

  // Indicador de "escribiendo..." Container:
  // • Layout: fila (flex-row)
  // • Alineación vertical: items-start
  // • Espaciado vertical: my-1
  typingIndicatorContainer: "flex-row my-1 items-start",

  // Avatar Container:
  // • Tamaño: w-16 h-16
  // • Forma: completamente redondo (rounded-full)
  // • Control de desbordamiento: overflow-hidden
  // • Alineación: centra contenido (justify-center, items-center)
  // • Espaciado horizontal: mx-2
  avatarContainer: "w-16 h-16 rounded-full overflow-hidden justify-center items-center mx-2",

  // Avatar Imagen:
  // • Tamaño completo: w-full h-full
  avatarImage: "w-full h-full",

  // Typing Indicator Bubble:
  // • Layout: fila con alineación centrada (flex-row items-center)
  // • Color de fondo: bg-gray-300
  // • Espaciado interno: p-2
  // • Forma: bordes redondeados (rounded-lg)
  // • Tamaño máximo: max-w-[70%]
  typingIndicatorBubble: "flex-row items-center bg-gray-300 p-2 rounded-lg max-w-[70%]",

  // Render de cada mensaje - Contenedor del Mensaje:
  // • Layout: fila (flex-row)
  // • Alineación vertical: items-start
  // • Espaciado vertical: my-1
  messageContainer: "flex-row my-1 items-start",

  // Chat Bubble (Bot):
  // • Layout: fila con alineación centrada (flex-row items-center)
  // • Color de fondo: bg-gray-300
  // • Espaciado interno: p-2
  // • Forma: bordes redondeados (rounded-lg)
  // • Tamaño máximo: max-w-[70%]
  chatBubbleBot: "flex-row items-center bg-gray-300 p-2 rounded-lg max-w-[70%]",

  // Chat Bubble (User):
  // • Layout: fila con alineación centrada (flex-row items-center)
  // • Color de fondo: bg-[#B8E6B9]
  // • Espaciado interno: p-2
  // • Forma: bordes redondeados (rounded-lg)
  // • Tamaño máximo: max-w-[70%]
  // • Posición: ml-auto (alinea a la derecha)
  chatBubbleUser: "flex-row items-center bg-[#B8E6B9] p-2 rounded-lg max-w-[70%] ml-auto",

  // Texto del Mensaje:
  // • Tamaño de fuente: text-base
  // • Color del texto: text-gray-500
  messageText: "text-base text-gray-500",

  // Imagen del Mensaje:
  // • Tamaño fijo: w-[200px] h-[200px]
  // • Forma: bordes redondeados (rounded-lg)
  // • Espaciado vertical: my-1
  messageImage: "w-[200px] h-[200px] rounded-lg my-1", // Estilo agregado

  // Header - Contenedor Principal:
  // • Layout: ocupa todo el espacio (flex-1)
  // • Color de fondo: bg-white
  container: "flex-1 bg-white",

  // Header - Contenedor Interno:
  // • Layout: columna (flex-col) y centrado (items-center)
  // • Color de fondo: bg-white
  // • Espaciado vertical y horizontal: py-5 px-4
  headerContainer: "flex-col items-center bg-white py-5 px-4",

  // Header - Imagen:
  // • Tamaño: w-24 h-24
  // • Forma: bordes redondeados (rounded-xl)
  // • Espaciado inferior: mb-2
  headerImage: "w-24 h-24 rounded-xl mb-2",

  // Header - Texto Principal:
  // • Tamaño de fuente: text-2xl
  // • Peso de fuente: font-normal
  // • Alineación: text-center
  headerText: "text-2xl font-normal text-center",

  // Header - Subtexto (Gris):
  // • Color del texto: text-gray-400
  headerSubTextGray: "text-gray-400",

  // Header - Subtexto (Verde):
  // • Color del texto: text-green-300
  headerSubTextGreen: "text-green-300",

  // Error Texto:
  // • Color del texto: text-red-500
  // • Espaciado superior: mt-2
  // • Alineación: text-center
  errorText: "text-red-500 mt-2 text-center",

  // Input y Botón de Envío - Contenedor:
  // • Layout: fila (flex-row) con alineación centrada (items-center)
  // • Espaciado interno: p-4
  // • Color de fondo: bg-white
  inputContainer: "flex-row items-center p-4 bg-white",

  // Campo de Entrada:
  // • Layout: ocupa el espacio disponible (flex-1)
  // • Tamaño: h-12
  // • Borde: border border-gray-300
  // • Forma: completamente redondo (rounded-full)
  // • Espaciado interno y externo: px-4, mr-2
  // • Color del texto: text-gray-400
  inputField: "flex-1 h-12 border border-gray-300 rounded-full px-4 mr-2 text-gray-400",

  // Botón de Envío:
  // • Tamaño: w-14 h-14
  // • Forma: completamente redondo (rounded-full)
  // • Alineación: centra el contenido (justify-center, items-center)
  sendButton: "w-14 h-14 rounded-full justify-center items-center",

  // Estado de Carga del Botón de Envío:
  // • Color de fondo: bg-green-300
  sendButtonLoading: "bg-green-300",

  // Estado por Defecto del Botón de Envío:
  // • Color de fondo: bg-[#5CB868]
  sendButtonDefault: "bg-[#5CB868]",

  // Modal para Imagen - Imagen:
  // • Tamaño: ancho completo (w-full)
  // • Proporción: cuadrada (aspect-square)
  // • Forma: bordes redondeados (rounded-lg)
  modalImage: "w-full aspect-square rounded-lg",

  // Modal para Imagen - Texto:
  // • Color del texto: text-gray-500
  modalText: "text-gray-500",
};
