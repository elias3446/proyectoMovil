export const styles = {
  // socialNetRoot:
  // • Espaciado: padding 4 (p-4)
  // • Layout: ocupa todo el espacio (flex-1)
  socialNetRoot: "p-4 flex-1",
  
  // titleContainer:
  // • Espaciado vertical: py-4
  titleContainer: "py-4",
  
  // titleText:
  // • Tipografía: tamaño 4xl, extrabold
  // • Color: personalizado (#5CB868)
  titleText: "text-4xl font-extrabold text-black",

  // createPostContainer:
  // • Layout: fila (flex) con items centrados (items-center)
  // • Forma: completamente redondo (rounded-full)
  // • Espaciado: gap de 2 (gap-2)
  createPostContainer: "flex flex-row items-center rounded-full gap-2",
  
  // profileImageThumbnail:
  // • Tamaño: altura y ancho 11 (h-11, w-11)
  // • Ajuste de imagen: object-cover
  // • Forma: redondeado (rounded-full)
  profileImageThumbnail: "object-cover h-11 w-11 rounded-full",
  
  // postContentInput:
  // • Layout: ocupa el espacio disponible (flex-1)
  // • Espaciado: padding horizontal y vertical (px-3 py-3)
  // • Forma: bordes redondeados (rounded-[20])
  // • Tipografía: semibold, text-xl
  // • Color: fondo personalizado (#F3F4F6)
  postContentInput: "flex-1 px-3 py-3 rounded-[20] font-semibold text-xl bg-[#F3F4F6]",
  
  // postImageThumbnail:
  // • Tamaño: ancho y alto 11 (w-11, h-11)
  // • Forma: bordes redondeados (rounded-lg)
  postImageThumbnail: "w-11 h-11 rounded-lg",

  // modalWidth:
  // • Tamaño: ancho relativo (w-3/4)
  modalWidth: "w-3/4",
  
  // modalHeight:
  // • Tamaño: altura definida (h-[41%])
  modalHeight: "h-[41%]",
  
  // modalImage:
  // • Tamaño: ancho completo (w-full)
  // • Proporción: cuadrada (aspect-square)
  // • Forma: bordes redondeados (rounded-lg)
  modalImage: "w-full aspect-square rounded-lg",
  
  // chooseImageButton:
  // • Layout: fila (flex-row) con gap 2 y items centrados (items-center)
  // • Espaciado: margen superior (mt-4), padding horizontal (px-4) y vertical (py-2)
  // • Color: fondo personalizado (#A5D6A7)
  // • Forma: bordes redondeados (rounded-lg)
  chooseImageButton: "flex-row gap-2 items-center mt-4 px-4 py-2 bg-[#A5D6A7] rounded-lg",
  
  // chooseImageButtonText:
  // • Tipografía: negrita (font-bold)
  // • Color: personalizado (#142C15)
  chooseImageButtonText: "text-[#142C15] font-bold",
  
  // noImageText:
  // • Color: texto gris (text-gray-500)
  noImageText: "text-gray-500",

  // publishButtonContainer:
  // • Espaciado: margen vertical (my-3)
  publishButtonContainer: "my-3",
  
  // publishButton:
  // • Color: fondo personalizado (#5CB868)
  // • Espaciado: padding vertical (py-3) y horizontal (px-4)
  // • Forma: bordes redondeados (rounded-[20px])
  publishButton: "bg-[#5CB868] py-3 px-4 rounded-[20px]",
  
  // publishButtonText:
  // • Tipografía: tamaño text-xl, font-medium
  // • Alineación: centrado (text-center)
  // • Color: texto blanco (#fff)
  publishButtonText: "text-[#fff] text-center text-xl font-medium",

  // sortButtonsContainer:
  // • Layout: fila (flex-row) con justificado a la izquierda (justify-start)
  // • Espaciado: gap 2 y margen inferior (mb-4)
  sortButtonsContainer: "flex flex-row justify-start gap-2 mb-4",

  // formContainer:
  // • Tamaño: ancho completo (w-full)
  // • Color: fondo blanco (bg-white)
  // • Forma: bordes redondeados (rounded-xl)
  // • Posición: relativa (relative)
  // • Tamaño máximo: dinámico según condición (width > 400 ? max-w-[25rem] : max-w-[calc(100%-40px)])
  formContainer: "w-full bg-white rounded-xl relative ${ width > 400 ? \"max-w-[25rem]\" : \"max-w-[calc(100%-40px)]\"}",
  
  // inputFirstName:
  // • Tamaño: altura 14 (h-14), ancho 48% (w-[48%])
  // • Espaciado: padding horizontal (px-4) y margen inferior (mb-3)
  // • Forma: bordes redondeados (rounded-xl)
  // • Tipografía: text-lg
  // • Color: fondo (#F3F4F6)
  // • Texto: color condicional (firstName ? text-black : text-[#9CA3AF])
  inputFirstName: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-[48%] ${ firstName ? \"text-black\" : \"text-[#9CA3AF]\"}",
  
  // inputLastName:
  // • Mismos estilos que inputFirstName para el apellido
  inputLastName: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-[48%] ${ lastName ? \"text-black\" : \"text-[#9CA3AF]\"}",
  
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
  // • Tipografía: tamaño base, negrita
  // • Color: negro
  // • Espaciado: margen inferior (mb-2)
  genderLabel: "text-base text-black mb-2 font-bold",
  
  // pronounLabel:
  // • Igual que genderLabel: tamaño base, negrita, negro, mb-2
  pronounLabel: "text-base text-black mb-2 font-bold",
  
  // pronounDescription:
  // • Tipografía: extra pequeño (text-xs)
  // • Color: personalizado (#666)
  // • Espaciado: margen inferior (mb-3)
  pronounDescription: "text-xs text-[#666] mb-3",
  
  // customGenderLabel:
  // • Tipografía: tamaño base, negrita
  // • Color: negro
  // • Espaciado: margen inferior (mb-2)
  customGenderLabel: "text-base text-black mb-2 font-bold",
  
  // inputCustomGender:
  // • Tamaño: altura 14, ancho completo (w-full)
  // • Espaciado: padding horizontal (px-4) y margen inferior (mb-3)
  // • Forma: bordes redondeados (rounded-xl)
  // • Tipografía: text-lg
  // • Color: fondo (#F3F4F6)
  // • Texto: color condicional (customGender ? text-black : text-[#9CA3AF])
  inputCustomGender: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${ customGender ? \"text-black\" : \"text-[#9CA3AF]\"}",
  
  // inputEmail:
  // • Estilos similares a inputCustomGender, con condición (email ? text-black : text-[#9CA3AF])
  inputEmail: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${ email ? \"text-black\" : \"text-[#9CA3AF]\"}",
  
  // passwordContainer:
  // • Posición: relativa para contener elementos posicionados
  passwordContainer: "relative",
  
  // inputPassword:
  // • Tamaño: altura 14, ancho completo
  // • Espaciado: padding horizontal (px-4), margen inferior (mb-3)
  // • Forma: bordes redondeados (rounded-xl)
  // • Tipografía: text-lg
  // • Color: fondo (#F3F4F6)
  // • Texto: color condicional (password ? text-black : text-[#9CA3AF])
  inputPassword: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${ password ? \"text-black\" : \"text-[#9CA3AF]\"}",
  
  // passwordToggleContainer:
  // • Posición: absoluta para superponer
  // • Ubicación: derecha 4 (right-4) y arriba 3 (top-3)
  // • Orden: z-index 20 (z-20)
  passwordToggleContainer: "absolute z-20 right-4 top-3",
  
  // headerImage:
  // • Tamaño: ancho 3/5, proporción cuadrada (aspect-square)
  // • Alineación: centrada (self-center)
  // • Posición: margen inferior negativo (mb-[-40px])
  headerImage: "w-3/5 aspect-square self-center mb-[-40px]",
  
  // headerTitle:
  // • Tipografía: negrita (font-bold), tamaño 2xl
  // • Alineación: centrado (text-center)
  // • Espaciado: margen inferior (mb-5)
  headerTitle: "font-bold text-2xl text-center mb-5",

  // termsText:
  // • Tipografía: tamaño base (text-base)
  // • Color: negro (text-black)
  termsText: "text-base text-black",
  
  // termsLink:
  // • Color: personalizado (#5CB868)
  termsLink: "text-[#5CB868]",
  
  // registerButton:
  // • Alineación: centra contenido (items-center)
  // • Espaciado: margen vertical (my-3) y padding (p-4)
  // • Forma: bordes redondeados (rounded-xl)
  // • Color: fondo personalizado (#5CB868)
  registerButton: "items-center my-3 p-4 rounded-xl bg-[#5CB868]",
  
  // registerButtonText:
  // • Tipografía: negrita (font-bold), tamaño grande (text-lg)
  // • Color: texto blanco (text-white)
  registerButtonText: "text-white font-bold text-lg",
  
  // loginLinkContainer:
  // • Tipografía: tamaño base (text-base) y color negro (text-black)
  // • Alineación: centrado (text-center)
  // • Espaciado: margen superior (mt-3)
  loginLinkContainer: "text-black text-center mt-3 text-base",
  
  // loginLinkText:
  // • Color: negro (text-black)
  loginLinkText: "text-black",
  
  // loginLinkHighlight:
  // • Color: personalizado (#5CB868)
  loginLinkHighlight: "text-[#5CB868]",
  
  // postItemRoot:
  // • Color: fondo personalizado (#F3F4F6)
  // • Espaciado: margen inferior (mb-2)
  // • Forma: bordes redondeados (rounded-lg)
  // • Layout: flex con gap 3
  postItemRoot: "bg-[#F3F4F6] mb-2 rounded-lg flex gap-3",
  
  // postHeaderContainer:
  // • Layout: fila (flex-row) con items centrados (items-center)
  // • Espaciado: gap 2, padding horizontal (px-4) y padding superior (pt-4)
  postHeaderContainer: "flex flex-row items-center gap-2 px-4 pt-4",
  
  // postUserProfileImage:
  // • Ajuste de imagen: object-cover
  // • Tamaño: altura y ancho 8 (h-8, w-8)
  // • Forma: redondeado (rounded-full)
  postUserProfileImage: "object-cover h-8 w-8 rounded-full",
  
  // postUsernameText:
  // • Tipografía: negrita (font-bold), tamaño de texto xl (text-xl)
  // • Color: personalizado (#5CB868) 
  postUsernameText: "text-[#5CB868] font-bold text-xl",
  
  // postContentText:
  // • Tipografía: tamaño xl (text-xl)
  // • Espaciado: padding horizontal (px-4) y vertical (py-2)
  postContentText: "text-xl px-4 py-2",
  
  // postImageContainer:
  // • Tamaño: ancho automático (w-auto)
  // • Proporción: cuadrada (aspect-square)
  // • Forma: bordes redondeados (rounded-lg)
  // • Espaciado: margen horizontal (mx-2)
  // • Ajuste de imagen: object-cover
  postImageContainer: "w-auto aspect-square rounded-lg mx-2 object-cover",
  
  // postActionsContainer:
  // • Layout: fila (flex-row) con items centrados (items-center)
  // • Distribución: justificado al inicio (justify-start)
  // • Espaciado: gap 2, padding horizontal (px-4), padding superior (pt-3) y padding inferior (pb-2)
  postActionsContainer: "flex flex-row items-center justify-start gap-2 px-4 pt-3 pb-2",
  
  // likeButton:
  // • Layout: fila (flex-row) con items centrados (items-center) y gap 2
  // • Tamaño: ancho 12 (w-12)
  likeButton: "flex flex-row items-center gap-2 w-12",
  
  // commentButton:
  // • Layout similar a likeButton: fila (flex-row) con items centrados y gap 2, ancho 12
  commentButton: "flex flex-row items-center gap-2 w-12",
  
  // postTimeText:
  // • Tipografía: tamaño predeterminado con color personalizado (#565a63)
  // • Espaciado: padding horizontal (px-4) y padding inferior (pb-4)
  postTimeText: "text-[#565a63] px-4 pb-4",
  
  // commentsContainer:
  // • Layout: flex con gap 4, padding inferior (pb-4) y padding horizontal (px-5)
  commentsContainer: "flex gap-4 pb-4 px-5",
  
  // commentContainer:
  // • Layout: fila (flex-row) con items centrados (items-center) y gap 2
  commentContainer: "flex flex-row items-center gap-2",
  
  // commentUserProfileImage:
  // • Ajuste de imagen: object-cover
  // • Tamaño: altura y ancho 8 (h-8, w-8)
  // • Forma: redondeado (rounded-full)
  commentUserProfileImage: "object-cover h-8 w-8 rounded-full",
  
  // commentTextContainer:
  // • Layout: contenedor flexible (flex)
  commentTextContainer: "flex",
  
  // commentInputContainer:
  // • Layout: fila (flex-row) con gap 2 y items centrados (items-center)
  commentInputContainer: "flex flex-row gap-2 items-center",
  
  // commentInput:
  // • Layout: ocupa el espacio disponible (flex-1)
  // • Espaciado: padding horizontal (px-4)
  // • Forma: completamente redondo (rounded-full)
  // • Tipografía: tamaño xl (text-xl)
  // • Color: fondo blanco (bg-white)
  commentInput: "flex-1 px-4 rounded-full text-xl bg-white",
  
  // commentSendIcon:
  // • Tamaño: ancho 7 (w-7)
  commentSendIcon: "w-7",
  
  // modalPostImage:
  // • Tamaño: ancho completo (w-full)
  // • Proporción: cuadrada (aspect-square)
  // • Forma: bordes redondeados (rounded-lg)
  modalPostImage: "w-full aspect-square rounded-lg",
  
  // modalProfileImage:
  // • Mismos estilos que modalPostImage para la imagen de perfil
  modalProfileImage: "w-full aspect-square rounded-lg",
};
