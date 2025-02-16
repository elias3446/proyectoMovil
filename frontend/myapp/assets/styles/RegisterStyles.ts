export const styles = {
    registerScreenRoot: "flex-1 bg-white",
    headerContainer: "p-5",
    headerImage: "w-3/5 aspect-square self-center mb-[-40px]",
    headerTitle: "font-bold text-2xl text-center mb-5",
    scrollView: "flex-grow",
    formContainer: "w-full bg-white rounded-xl relative ${ width > 400 ? \"max-w-[25rem]\" : \"max-w-[calc(100%-40px)]\" }",
    rowInputContainer: "flex-row justify-between mb-3",
    inputFirstName: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-[48%] ${ firstName ? \"text-black\" : \"text-[#9CA3AF]\" }",
    inputLastName: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-[48%] ${ lastName ? \"text-black\" : \"text-[#9CA3AF]\" }",
    birthDateLabel: "text-base text-black mb-2 font-bold",
    birthDateContainer: "flex-row justify-between mb-3",
    genderLabel: "text-base text-black mb-2 font-bold",
    pronounLabel: "text-base text-black mb-2 font-bold",
    pronounDescription: "text-xs text-[#666] mb-3",
    customGenderLabel: "text-base text-black mb-2 font-bold",
    inputCustomGender: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${ customGender ? \"text-black\" : \"text-[#9CA3AF]\" }",
    inputEmail: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${ email ? \"text-black\" : \"text-[#9CA3AF]\" }",
    passwordContainer: "relative",
    inputPassword: "h-14 px-4 mb-3 rounded-xl text-lg bg-[#F3F4F6] w-full ${ password ? \"text-black\" : \"text-[#9CA3AF]\" }",
    passwordToggleContainer: "absolute z-20 right-4 top-3",
    footerContainer: "p-5",
    termsContainer: "flex-row items-center mb-3",
    checkboxMargin: "mr-2",
    termsText: "text-base text-black",
    termsLink: "text-[#5CB868]",
    registerButton: "items-center my-3 p-4 rounded-xl bg-[#5CB868]",
    registerButtonText: "text-white font-bold text-lg",
    loginLinkContainer: "text-black text-center mt-3 text-base",
    loginLinkText: "text-black",
    loginLinkHighlight: "text-[#5CB868]",
  };
  