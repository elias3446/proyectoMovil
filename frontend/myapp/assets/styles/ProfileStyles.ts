export const styles = {
  // customModalWebPressable:
  // • Layout: ocupa todo el espacio (flex-1)
  // • Posición: fixed, ocupa toda la pantalla (inset-0) y z-index (z-[999])
  // • Alineación: centra contenido (justify-center, items-center)
  // • Color: fondo semitransparente (bg-black/50)
  customModalWebPressable:
    "flex-1 fixed inset-0 z-[999] justify-center items-center bg-black/50",

  // customModalWebView:
  // • Tamaño: ancho relativo (w-11/12)
  // • Espaciado: padding (p-5)
  // • Color: fondo blanco (bg-white)
  // • Forma: bordes redondeados (rounded-2xl)
  // • Efecto: sombra (shadow)
  customModalWebView: "w-11/12 p-5 bg-white rounded-2xl shadow",

  // profileScreenRoot:
  // • Layout: ocupa todo el espacio (flex-1)
  // • Color: fondo blanco (bg-white)
  profileScreenRoot: "flex-1 bg-white",

  // headerContainer:
  // • Posición: relativa (relative)
  // • Espaciado: padding (p-5)
  headerContainer: "relative p-5",

  // scrollView:
  // • Flexibilidad: permite crecer (flex-grow)
  scrollView: "flex-grow",

  // labelSmall:
  // • Espaciado: padding horizontal (px-1) y margen inferior (mb-[6px])
  // • Tipografía: tamaño (text-base) y peso (font-bold)
  // • Color: texto negro (text-black)
  labelSmall: "px-1 mb-[6px] text-base font-bold text-black",

  // inputName:
  // • Tamaño: ancho completo (w-full) y altura fija (h-[40px])
  // • Espaciado: padding horizontal (px-[15px]) y margen inferior (mb-2)
  // • Color: fondo (bg-[#F3F4F6]) y texto (text-black)
  // • Forma: bordes redondeados (rounded-[12px])
  // • Tipografía: tamaño (text-base)
  inputName:
    "w-full h-[40px] px-[15px] mb-2 bg-[#F3F4F6] rounded-[12px] text-base text-black",

  // inputEmail:
  // • Tamaño: ancho completo (w-full) y altura fija (h-[40px])
  // • Espaciado: padding horizontal (px-[15px]) y margen inferior (mb-3)
  // • Color: fondo (bg-[#F3F4F6]) y texto (text-black)
  // • Forma: bordes redondeados (rounded-[12px])
  // • Tipografía: tamaño (text-base)
  inputEmail:
    "w-full h-[40px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black",

  // birthDateLabel:
  // • Espaciado: margen inferior (mb-2)
  // • Tipografía: tamaño (text-base) y peso (font-bold)
  // • Color: texto negro (text-black)
  birthDateLabel: "mb-2 text-base font-bold text-black",

  // pickerContainer:
  // • Layout: fila (flex-row) y distribución (justify-between)
  // • Espaciado: margen inferior (mb-3)
  pickerContainer: "flex-row justify-between mb-3",

  // genderLabel:
  // • Espaciado: margen inferior (mb-2)
  // • Tipografía: tamaño (text-base) y peso (font-bold)
  // • Color: texto negro (text-black)
  genderLabel: "mb-2 text-base font-bold text-black",

  // pronounLabel:
  // • Espaciado: margen inferior (mb-2)
  // • Tipografía: tamaño (text-base) y peso (font-bold)
  // • Color: texto negro (text-black)
  pronounLabel: "mb-2 text-base font-bold text-black",

  // pronounDescription:
  // • Espaciado: margen inferior (mb-3)
  // • Tipografía: tamaño reducido (text-xs)
  // • Color: texto personalizado (text-[#666])
  pronounDescription: "mb-3 text-xs text-[#666]",

  // customGenderLabel:
  // • Espaciado: margen inferior (mb-2)
  // • Tipografía: tamaño (text-base) y peso (font-bold)
  // • Color: texto negro (text-black)
  customGenderLabel: "mb-2 text-base font-bold text-black",

  // customGenderInput:
  // • Tamaño: ancho completo (w-full) y altura (h-14)
  // • Espaciado: padding horizontal (px-4) y margen inferior (mb-3)
  // • Color: fondo (bg-[#F3F4F6]) y texto dinámico según condición
  // • Forma: bordes redondeados (rounded-xl)
  // • Tipografía: tamaño (text-lg)
  customGenderInput:
    "w-full h-14 px-4 mb-3 bg-[#F3F4F6] rounded-xl text-lg ${customGender ? \"text-black\" : \"text-[#9CA3AF]\"}",

  // passwordLabel:
  // • Espaciado: margen inferior (mb-[6px])
  // • Tipografía: tamaño (text-base) y peso (font-bold)
  // • Color: texto negro (text-black)
  passwordLabel: "mb-[6px] text-base font-bold text-black",

  // passwordInput:
  // • Tamaño: ancho completo (w-full) y altura fija (h-[40px])
  // • Espaciado: padding horizontal (px-[15px]) y margen inferior (mb-3)
  // • Color: fondo (bg-[#F3F4F6]) y texto (text-black)
  // • Forma: bordes redondeados (rounded-[12px])
  // • Tipografía: tamaño (text-base)
  passwordInput:
    "w-full h-[40px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black",

  // footerContainer:
  // • Espaciado: padding (p-5)
  footerContainer: "p-5",

  // saveButton:
  // • Espaciado: padding (p-[12px]) y margen vertical (my-1)
  // • Forma: bordes redondeados (rounded-[20px]) y centrado de contenido (items-center)
  // • Color: fondo personalizado (bg-[#5CB868])
  saveButton:
    "my-1 p-[12px] rounded-[20px] items-center bg-[#5CB868]",

  // saveButtonText:
  // • Tipografía: tamaño (text-base), peso (font-bold)
  // • Color: texto blanco (text-white)
  saveButtonText: "text-base font-bold text-white",

  // modalContainer:
  // • Espaciado: padding (p-5)
  modalContainer: "p-5",

  // modalTitle:
  // • Espaciado: margen inferior (mb-5)
  // • Tipografía: tamaño (text-lg) y peso (font-bold)
  // • Alineación: centrado (text-center)
  modalTitle: "mb-5 text-lg font-bold text-center",

  // modalButtonContainer:
  // • Layout: columna (flex-col) y centrado de contenido (items-center)
  modalButtonContainer: "flex flex-col items-center",

  // modalCancelButton:
  // • Tamaño: ancho fijo (w-[140px])
  // • Espaciado: padding (p-3)
  // • Forma: bordes redondeados (rounded-[25px]) y centrado (items-center)
  // • Color: fondo gris (bg-gray-300)
  modalCancelButton:
    "w-[140px] p-3 rounded-[25px] items-center bg-gray-300",

  // modalButtonText:
  // • Tamaño: ancho completo (w-full)
  // • Tipografía: tamaño (text-base) y peso (font-bold)
  // • Color: texto blanco (text-white)
  // • Alineación: centrado (text-center)
  modalButtonText:
    "w-full text-base font-bold text-center text-white",

  // modalSignOutButton:
  // • Tamaño: ancho fijo (w-[140px])
  // • Espaciado: padding (p-3)
  // • Forma: bordes redondeados (rounded-[25px]) y centrado (items-center)
  // • Color: fondo personalizado (bg-[#E53935])
  modalSignOutButton:
    "w-[140px] p-3 rounded-[25px] items-center bg-[#E53935]",

  // profileImageModal:
  // • Tamaño: ancho completo (w-full)
  // • Proporción: cuadrada (aspect-square)
  // • Forma: bordes redondeados (rounded-lg)
  profileImageModal: "w-full aspect-square rounded-lg",

  // textCenter:
  // • Alineación: texto centrado (text-center)
  textCenter: "text-center",
};
