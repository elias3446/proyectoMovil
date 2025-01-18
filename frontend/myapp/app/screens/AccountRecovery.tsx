import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

interface LoginProps {
    setCurrentScreen: (screen: string) => void;
  }

const AccountRecovery : React.FC<LoginProps> = ({ setCurrentScreen }) =>{
  const [emailOrPhone, setEmailOrPhone] = useState("");

  const handleSubmit = () => {
    console.log("Buscando cuenta con:", emailOrPhone);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Formulario de Recuperación */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>Recupera tu cuenta</Text>
        <Text style={styles.instruction}>
          Ingresa tu correo electrónico o número de celular para buscar tu cuenta.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico o número de celular"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          keyboardType="email-address"
          autoFocus={true}
        />

        {/* Botones de acción */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setCurrentScreen("Login")}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  instruction: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#1877f2",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerTextContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
  },
});

export default AccountRecovery;
