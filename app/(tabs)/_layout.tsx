import { Stack } from "expo-router";
import React from "react";

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Ocultamos los headers para que sea más limpio
        gestureEnabled: true, // Habilitamos gestos para navegar
        gestureDirection: "horizontal", // Dirección del gesto
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Inicio",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
