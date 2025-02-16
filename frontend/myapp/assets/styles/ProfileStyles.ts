export const styles = {
    // CustomModal (versión web)
    customModalWebPressable: "flex-1 justify-center items-center bg-black/50 fixed inset-0 z-[999]",
    customModalWebView: "w-11/12 bg-white p-5 rounded-2xl shadow",
  
    // ProfileScreen
    profileScreenRoot: "flex-1 bg-white",
    headerContainer: "p-5 relative",
    scrollView: "flex-grow",
  
    // Etiquetas e inputs
    labelSmall: "text-base text-black font-bold mb-[6px] px-1",
    inputName: "w-full h-[40px] px-[15px] mb-2 bg-[#F3F4F6] rounded-[12px] text-base text-black",
    inputEmail: "w-full h-[40px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black",
    birthDateLabel: "text-base text-black font-bold mb-2",
    pickerContainer: "flex-row justify-between mb-3",
    genderLabel: "text-base text-black font-bold mb-2",
    pronounLabel: "text-base text-black mb-2 font-bold",
    pronounDescription: "text-xs text-[#666] mb-3",
    customGenderLabel: "text-base text-black mb-2 font-bold",
    customGenderInput: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${customGender ? \"text-black\" : \"text-[#9CA3AF]\"}",
    passwordLabel: "text-base text-black font-bold mb-[6px]",
    passwordInput: "w-full h-[40px] px-[15px] mb-3 bg-[#F3F4F6] rounded-[12px] text-base text-black",
  
    // Footer y botones
    footerContainer: "p-5",
    saveButton: "p-[12px] rounded-[20px] items-center my-1 bg-[#5CB868]",
    saveButtonText: "text-white text-base font-bold",
  
    // Modal para cerrar sesión
    modalContainer: "p-5",
    modalTitle: "text-lg font-bold mb-5 text-center",
    modalButtonContainer: "flex flex-col items-center",
    modalCancelButton: "w-[140px] p-3 rounded-[25px] items-center bg-gray-300",
    modalButtonText: "w-full text-white text-base font-bold text-center",
    modalSignOutButton: "w-[140px] p-3 rounded-[25px] items-center bg-[#E53935]",
  
    // Modal de imagen de perfil
    profileImageModal: "w-full aspect-square rounded-lg",
    textCenter: "text-center",
  };
  