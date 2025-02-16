export const styles = {
  // permissionView:
  // • Layout: ocupa todo el espacio (flex-1)
  // • Alineación: centra contenido vertical y horizontalmente (justify-center, items-center)
  // • Espaciado: padding (p-5)
  permissionView: "flex-1 justify-center items-center p-5",

  // permissionText:
  // • Alineación: texto centrado (text-center)
  // • Espaciado: margen inferior (mb-5)
  // • Tipografía: tamaño base (text-base), color negro (text-black)
  permissionText: "text-center mb-5 text-base text-black",

  // rootView:
  // • Layout: ocupa todo el espacio (flex-1)
  // • Color: fondo blanco (bg-white)
  // • Alineación: centra horizontalmente (justify-center)
  rootView: "flex-1 bg-white justify-center",

  // cameraOverlay:
  // • Posición: ocupa toda la vista de forma absoluta (absolute inset-0)
  // • Bordes: borde con color blanco (border border-white)
  // • Opacidad: 60% (opacity-60)
  cameraOverlay: "absolute inset-0 border border-white opacity-60",

  // zoomControls:
  // • Posición: absoluta, fija en la parte inferior (bottom-32 left-0 right-0)
  // • Layout: fila (flex-row) con centrado (justify-center, items-center)
  // • Espaciado: separación horizontal entre elementos (space-x-1)
  zoomControls: "absolute bottom-32 left-0 right-0 flex-row justify-center items-center space-x-1",

  // captureContainer:
  // • Posición: absoluta, fijada en el fondo (bottom-0 left-0 right-0)
  // • Color: fondo blanco (bg-white)
  // • Tamaño: altura definida (h-[100px])
  // • Layout: fila (flex-row) con centrado (justify-center, items-center)
  captureContainer: "absolute bottom-0 left-0 right-0 bg-white h-[100px] flex-row justify-center items-center",

  // captureButton:
  // • Forma: botón completamente redondo (rounded-full)
  captureButton: "rounded-full",

  // captureBorder:
  // • Bordes: grosor de 4 (border-4) con color personalizado (border-[#A5D6A7])
  // • Forma: borde redondeado completo (rounded-full)
  // • Espaciado: padding (p-1)
  captureBorder: "border-4 border-[#A5D6A7] rounded-full p-1",

  // captureInner:
  // • Color: fondo personalizado (bg-[#5CB868])
  // • Forma: redondo (rounded-full)
  // • Tamaño: ancho y alto específicos (w-[60px] h-[60px])
  captureInner: "bg-[#5CB868] rounded-full w-[60px] h-[60px]",

  // galleryButton:
  // • Posición: absoluta, ubicada en la esquina inferior derecha (bottom-7 right-7)
  // • Orden en z-index: (z-[3])
  galleryButton: "absolute bottom-7 right-7 z-[3]",

  // topControls:
  // • Posición: absoluta, ubicada en la parte superior derecha (top-3 right-3)
  // • Layout: fila (flex-row) con alineación (justify-start, items-center)
  // • Orden en z-index: (z-[3])
  topControls: "absolute top-3 right-3 flex-row justify-start items-center z-[3]",

  // flashButton:
  // • Color: fondo transparente (bg-transparent)
  // • Espaciado: padding (p-1)
  // • Alineación: centra el contenido (justify-center, items-center)
  // • Forma: esquinas redondeadas (rounded-xl)
  flashButton: "bg-transparent p-1 justify-center items-center rounded-xl",

  // cameraToggleButton:
  // • Color: fondo transparente (bg-transparent)
  // • Espaciado: padding (p-1)
  // • Alineación: centra el contenido (justify-center, items-center)
  // • Forma: esquinas redondeadas (rounded-xl)
  cameraToggleButton: "bg-transparent p-1 justify-center items-center rounded-xl",
};
