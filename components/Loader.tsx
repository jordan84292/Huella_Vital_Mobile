import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface LoaderProps {
  message?: string;
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({
  message = "Cargando...",
  color = "#007BFF",
}) => (
  <View style={styles.overlay}>
    <ActivityIndicator size="large" color={color} />
    <Text style={[styles.text, { color }]}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Loader;
