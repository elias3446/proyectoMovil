export const styles = {
  // Screen Root:
  // • Layout: full flex container (flex-1)
  // • Color: white background (bg-white)
  registerScreenRoot: "flex-1 bg-white",

  // Scrollable Content:
  // • Flexibilidad: permite crecer (flex-grow)
  scrollView: "flex-grow",

  // headerContainer:
  // • Espaciado: padding 5 (p-5)
  headerContainer: "p-5",
  
  // headerImage:
  // • Tamaño: ancho relativo (w-3/5)
  // • Proporción: cuadrada (aspect-square)
  // • Alineación: centrada (self-center)
  // • Posición: margen inferior negativo (mb-[-40px])
  headerImage: "w-3/5 aspect-square self-center mb-[-40px]",
  
  // headerTitle:
  // • Tipografía: fuente en negrita (font-bold)
  // • Tamaño de texto: 2xl (text-2xl)
  // • Alineación: centrado (text-center)
  // • Espaciado: margen inferior (mb-5)
  headerTitle: "font-bold text-2xl text-center mb-5",

  /* ==================================================
   * Form Section
   * ================================================== */
  
  // formContainer:
  // • Tamaño: ancho completo (w-full)
  // • Color: fondo blanco (bg-white)
  // • Forma: bordes redondeados (rounded-xl)
  // • Posición: relativa (relative)
  // • Tamaño máximo: cambia según la condición (width > 400 ? max-w-[25rem] : max-w-[calc(100%-40px)])
  formContainer:
    "w-full bg-white rounded-xl relative ${ width > 400 ? \"max-w-[25rem]\" : \"max-w-[calc(100%-40px)]\" }",
  
  // rowInputContainer:
  // • Layout: fila (flex-row) con distribución justificada (justify-between)
  // • Espaciado: margen inferior (mb-3)
  rowInputContainer: "flex-row justify-between mb-3",
  
  // inputFirstName:
  // • Tamaño: altura 14 (h-14), ancho 48% (w-[48%])
  // • Espaciado: padding horizontal 4 (px-4) y margen inferior (mb-3)
  // • Forma: bordes redondeados (rounded-xl)
  // • Tipografía: tamaño grande (text-lg)
  // • Color: fondo (#F3F4F6)
  // • Texto: color condicional (firstName ? text-black : text-[#9CA3AF])
  inputFirstName:
    "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-[48%] ${ firstName ? \"text-black\" : \"text-[#9CA3AF]\" }",
  
  // inputLastName:
  // • Características similares a inputFirstName para el apellido
  inputLastName:
    "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-[48%] ${ lastName ? \"text-black\" : \"text-[#9CA3AF]\" }",
  
  // birthDateLabel:
  // • Tipografía: tamaño base (text-base), negrita (font-bold)
  // • Color: negro (text-black)
  // • Espaciado: margen inferior (mb-2)
  birthDateLabel: "text-base text-black mb-2 font-bold",
  
  // birthDateContainer:
  // • Layout: fila (flex-row) con distribución justificada (justify-between)
  // • Espaciado: margen inferior (mb-3)
  birthDateContainer: "flex-row justify-between mb-3",
  
  // genderLabel:
  // • Tipografía: tamaño base (text-base), negrita (font-bold)
  // • Color: negro (text-black)
  // • Espaciado: margen inferior (mb-2)
  genderLabel: "text-base text-black mb-2 font-bold",
  
  // pronounLabel:
  // • Similar a genderLabel
  pronounLabel: "text-base text-black mb-2 font-bold",
  
  // pronounDescription:
  // • Tipografía: extra pequeño (text-xs)
  // • Color: personalizado (#666)
  // • Espaciado: margen inferior (mb-3)
  pronounDescription: "text-xs text-[#666] mb-3",
  
  // customGenderLabel:
  // • Características similares a otros labels: base, negrita, negro, con margen inferior (mb-2)
  customGenderLabel: "text-base text-black mb-2 font-bold",
  
  // inputCustomGender:
  // • Tamaño: altura 14 (h-14), ancho completo (w-full)
  // • Espaciado: padding horizontal 4 (px-4) y margen inferior (mb-3)
  // • Forma: bordes redondeados (rounded-xl)
  // • Tipografía: tamaño grande (text-lg)
  // • Color: fondo (#F3F4F6)
  // • Texto: color condicional (customGender ? text-black : text-[#9CA3AF])
  inputCustomGender:
    "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${ customGender ? \"text-black\" : \"text-[#9CA3AF]\" }",
  
  // inputEmail:
  // • Características: altura 14, padding horizontal 4, margen inferior 3, bordes redondeados, tamaño de texto grande, fondo (#F3F4F6), ancho completo
  // • Texto: color condicional (email ? text-black : text-[#9CA3AF])
  inputEmail:
    "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${ email ? \"text-black\" : \"text-[#9CA3AF]\" }",
  
  // passwordContainer:
  // • Posición: relativa (relative) para contener elementos posicionados
  passwordContainer: "relative",
  
  // inputPassword:
  // • Características: altura 14, padding horizontal 4, margen inferior 3, bordes redondeados, tamaño de texto grande, fondo (#F3F4F6), ancho completo
  // • Texto: color condicional (password ? text-black : text-[#9CA3AF])
  inputPassword:
    "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${ password ? \"text-black\" : \"text-[#9CA3AF]\" }",
  
  // passwordToggleContainer:
  // • Posición: absoluta (absolute) para superponer
  // • Ubicación: derecha 4 (right-4) y arriba 3 (top-3)
  // • Orden: z-index 20 (z-20)
  passwordToggleContainer: "absolute z-20 right-4 top-3",

  // footerContainer:
  // • Espaciado: padding 5 (p-5)
  footerContainer: "p-5",
  
  // termsContainer:
  // • Layout: fila (flex-row) con elementos centrados verticalmente (items-center)
  // • Espaciado: margen inferior (mb-3)
  termsContainer: "flex-row items-center mb-3",
  
  // checkboxMargin:
  // • Espaciado: margen a la derecha (mr-2)
  checkboxMargin: "mr-2",
  
  // termsText:
  // • Tipografía: tamaño base (text-base)
  // • Color: negro (text-black)
  termsText: "text-base text-black",
  
  // termsLink:
  // • Color: personalizado (#5CB868) para enlaces
  termsLink: "text-[#5CB868]",
  
  // registerButton:
  // • Alineación: centra contenido (items-center)
  // • Espaciado: margen vertical (my-3) y padding 4 (p-4)
  // • Forma: bordes redondeados (rounded-xl)
  // • Color: fondo personalizado (#5CB868)
  registerButton: "items-center my-3 p-4 rounded-xl bg-[#5CB868]",
  
  // registerButtonText:
  // • Tipografía: fuente en negrita (font-bold), tamaño grande (text-lg)
  // • Color: texto blanco (text-white)
  registerButtonText: "text-white font-bold text-lg",
  
  // loginLinkContainer:
  // • Tipografía: tamaño base (text-base) y color negro (text-black)
  // • Alineación: texto centrado (text-center)
  // • Espaciado: margen superior (mt-3)
  loginLinkContainer: "text-black text-center mt-3 text-base",
  
  // loginLinkText:
  // • Color: negro (text-black)
  loginLinkText: "text-black",
  
  // loginLinkHighlight:
  // • Color: personalizado (#5CB868) para destacar el enlace
  loginLinkHighlight: "text-[#5CB868]",
};
