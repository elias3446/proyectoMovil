import React from "react";
import { Modal, View, TouchableWithoutFeedback, StyleSheet, Dimensions } from "react-native";

// Interfaz de propiedades para el componente CustomModal.
interface CustomModalProps {
  /** Indica si el modal es visible o no */
  visible: boolean;
  /** Función que se ejecuta para cerrar el modal */
  onClose: () => void;
  /** Contenido que se mostrará dentro del modal */
  children: React.ReactNode;
  /** Ancho del modal, opcional (valor por defecto: "80%") */
  width?: string;
  /** Alto del modal, opcional (valor por defecto: "auto") */
  height?: string;
}

/**
 * CustomModal:
 * Componente reutilizable que renderiza un modal transparente con una superposición oscura.
 * Al tocar fuera del contenido se cierra el modal.
 */
const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  children,
  width,
  height,
}) => {
  // Define estilos para el contenedor interno del modal, combinando valores por defecto con los recibidos.
  const containerStyle = {
    width: width || "80%",
    height: height || "auto",
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      {/* Tocar fuera del modal cierra el modal */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Evita que el toque se propague al contenedor externo */}
          <TouchableWithoutFeedback>
          <View className={`${width} ${height} p-5 bg-white rounded-lg items-center`}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Estilos para el componente CustomModal
const styles = StyleSheet.create({
  // Estilo de la superposición: cubre toda la pantalla con fondo semitransparente
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  // Contenedor principal del modal
  modalContainer: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    alignItems: "center",
  },
});

export default CustomModal;
