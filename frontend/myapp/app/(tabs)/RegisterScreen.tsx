import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";

const RegistrationForm = () => {
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

        {/* Botón de registro */}
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Registrar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    flex: 1,
  },
  inputHalf: {
    width: "48%",
  },
  inputThird: {
    width: "32%",
  },
  picker: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  note: {
    fontSize: 12,
    color: "#666",
    marginBottom: 15,
  },
  registerButton: {
    backgroundColor: "#1877f2",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 15,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RegistrationForm;
