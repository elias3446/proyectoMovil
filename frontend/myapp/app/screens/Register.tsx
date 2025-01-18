import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";

interface LoginProps {
  setCurrentScreen: (screen: string) => void;
}

const Register : React.FC<LoginProps> = ({ setCurrentScreen }) =>{
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDay, setBirthDay] = useState("1");
  const [birthMonth, setBirthMonth] = useState("1");
  const [birthYear, setBirthYear] = useState("2025");
  const [gender, setGender] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [customGender, setCustomGender] = useState("");

  const handleRegister = () => {
    console.log("Registrando usuario...");
    // Aquí puedes implementar el registro con Firebase o el backend que utilices
  };

  const handleCancel = () => {
    console.log("Registro cancelado");
    // Aquí puedes implementar la lógica para cancelar o limpiar el formulario
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Crea una cuenta</Text>
        <Text style={styles.subtitle}>Es rápido y fácil.</Text>

        {/* Nombre y Apellido */}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Nombre"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Apellido"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        {/* Fecha de nacimiento */}
        <Text style={styles.label}>Fecha de nacimiento</Text>
        <View style={styles.row}>
          <Picker
            selectedValue={birthDay}
            style={[styles.picker, styles.inputThird]}
            onValueChange={(itemValue) => setBirthDay(itemValue)}
          >
            {[...Array(31).keys()].map((day) => (
              <Picker.Item key={day + 1} label={(day + 1).toString()} value={(day + 1).toString()} />
            ))}
          </Picker>
          <Picker
            selectedValue={birthMonth}
            style={[styles.picker, styles.inputThird]}
            onValueChange={(itemValue) => setBirthMonth(itemValue)}
          >
            {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map(
              (month, index) => (
                <Picker.Item key={index} label={month} value={(index + 1).toString()} />
              )
            )}
          </Picker>
          <Picker
            selectedValue={birthYear}
            style={[styles.picker, styles.inputThird]}
            onValueChange={(itemValue) => setBirthYear(itemValue)}
          >
            {[...Array(100).keys()]
              .map((year) => new Date().getFullYear() - year)
              .map((year) => (
                <Picker.Item key={year} label={year.toString()} value={year.toString()} />
              ))}
          </Picker>
        </View>

        {/* Género */}
        <Text style={styles.label}>Género</Text>
        <Picker
          selectedValue={gender}
          style={styles.picker}
          onValueChange={(itemValue) => setGender(itemValue)}
        >
          <Picker.Item label="Selecciona tu género" value="" />
          <Picker.Item label="Mujer" value="F" />
          <Picker.Item label="Hombre" value="M" />
          <Picker.Item label="Personalizado" value="O" />
        </Picker>

        {/* Pronombres y género personalizado */}
        {gender === "O" && (
          <>
            <Text style={styles.label}>Selecciona tu pronombre</Text>
            <Picker
              selectedValue={pronoun}
              style={styles.picker}
              onValueChange={(itemValue) => setPronoun(itemValue)}
            >
              <Picker.Item label="Selecciona tu pronombre" value="" />
              <Picker.Item label='Femenino: "Salúdala por su cumpleaños"' value="Femenino" />
              <Picker.Item label='Masculino: "Salúdalo por su cumpleaños"' value="Masculino" />
              <Picker.Item label='Neutro: "Salúdalo(a) por su cumpleaños"' value="Neutro" />
            </Picker>
            <Text style={styles.note}>Tu pronombre será visible para todos.</Text>

            <Text style={styles.label}>Género (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu género"
              value={customGender}
              onChangeText={setCustomGender}
            />
          </>
        )}

        {/* Botones de registro y cancelar */}
        <View style={[styles.row, styles.buttonRow]}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setCurrentScreen("Login")}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.registerButton]} >
            <Text style={styles.registerButtonText}>Registrar</Text>
          </TouchableOpacity>
        </View>

        {/* Si deseas navegar después del registro */}
        {/* navigation.navigate('Home'); */}
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  buttonRow: {
    marginTop: 12,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 6,
    backgroundColor: "#f9f9f9",
  },
  inputHalf: {
    width: "48%",
  },
  inputThird: {
    width: "32%",
  },
  picker: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 6,
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  note: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 3,
  },
  registerButton: {
    backgroundColor: "#1877f2",
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Register;
