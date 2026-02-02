import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { axiosApi } from "../axiosApi/axiosApi";
import Loader from "../../components/Loader";
import Dashboard from "../../components/Dashboard";

export default function HomeScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // actual
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const userData = await SecureStore.getItemAsync("userData");

      if (token && userData) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAuthData = async (token: string, user: any) => {
    try {
      await SecureStore.setItemAsync("authToken", token);
      await SecureStore.setItemAsync("userData", JSON.stringify(user));
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };
  const validateConfirmPassword = (confirm: string, newPass: string) => {
    if (!isRegister) return true;
    if (!confirm) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Debes confirmar la contraseña",
      }));
      return false;
    }
    if (confirm !== newPass) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Las contraseñas no coinciden",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    return true;
  };

  const validateNewPassword = (password: string) => {
    if (!isRegister) return true;
    const errorsArr: string[] = [];
    if (!password) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "La nueva contraseña es requerida",
      }));
      return false;
    }
    if (password.length < 8) errorsArr.push("mínimo 8 caracteres");
    if (!/[A-Z]/.test(password)) errorsArr.push("una letra mayúscula");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
      errorsArr.push("un carácter especial");
    if (errorsArr.length > 0) {
      setErrors((prev) => ({
        ...prev,
        newPassword: `La contraseña debe tener ${errorsArr.join(", ")}`,
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, newPassword: "" }));
    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "El email es requerido" }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Dirección de correo inválida" }));
      return false;
    }
    setErrors((prev) => ({ ...prev, email: "" }));
    return true;
  };

  const validatePassword = (password: string | any[]) => {
    if (!password) {
      setErrors((prev) => ({
        ...prev,
        password: "La contraseña es requerida",
      }));
      return false;
    }
    if (password.length < 8) {
      setErrors((prev) => ({
        ...prev,
        password: "La contraseña debe tener mínimo 8 caracteres",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: "" }));
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(
      confirmPassword,
      newPassword,
    );

    if (
      !isEmailValid ||
      !isPasswordValid ||
      (isRegister && (!isNewPasswordValid || !isConfirmPasswordValid))
    )
      return;

    try {
      if (isRegister) {
        // Paso 1: Login para obtener token
        const loginResponse = await axiosApi.post("/auth/login", {
          email: email,
          password: password,
        });
        if (!loginResponse.data.success) {
          Alert.alert(
            "Error",
            "Credenciales incorrectas. Verifica tu email y contraseña.",
          );
          return;
        }
        const { token, user } = loginResponse.data.data;
        // Paso 2: Actualizar contraseña
        const updateResponse = await axiosApi.put(
          "/auth/profile",
          {
            nombre: user.nombre,
            email: user.email,
            telefono: user.telefono,
            currentPassword: password,
            newPassword: newPassword,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (updateResponse.data.success) {
          Alert.alert(
            "¡Éxito!",
            "Contraseña actualizada exitosamente. Ahora puedes iniciar sesión.",
            [
              {
                text: "OK",
                onPress: () => {
                  setIsRegister(false);
                  setPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                },
              },
            ],
          );
        } else {
          Alert.alert(
            "Error",
            updateResponse.data.message || "Error al actualizar la contraseña.",
          );
        }
      } else {
        // Login normal
        const response = await axiosApi.post("/auth/login", {
          email: email,
          password: password,
        });
        if (response.data.success) {
          const userData = response.data.data.user;
          const token = response.data.data.token;

          // Guardar token y datos del usuario en SecureStore
          await saveAuthData(token, userData);
          console.log("Token recibido:", token);

          setIsAuthenticated(true);
        } else {
          Alert.alert(
            "Error",
            "Error en la autenticación. Verifica tus credenciales.",
          );
        }
      }
    } catch (error: any) {
      console.error("Error en la autenticación/registro:", error);

      // Manejar error 401 (credenciales inválidas)
      if (error.response?.status === 401) {
        Alert.alert(
          "Credenciales Inválidas",
          "El email o la contraseña son incorrectos. Por favor, verifica tus datos e intenta nuevamente.",
        );
      } else if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert(
          "Error",
          "Ocurrió un error al intentar procesar la solicitud. Inténtalo de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoading(false);
  };

  const imageSource = isRegister
    ? require("../../assets/images/cat.png")
    : require("../../assets/images/dog.png");

  // Show loading while checking authentication state
  if (loading) {
    return <Loader message="Verificando autenticación..." />;
  }

  // Show Dashboard if authenticated
  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>🐾 Huella Vital</Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? "Actualiza tu contraseña para completar tu registro"
              : "Inicia sesión para gestionar tu clínica veterinaria"}
          </Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {loading ? (
          <Loader
            message={
              isRegister ? "Procesando registro..." : "Iniciando sesión..."
            }
          />
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                <Ionicons name="mail-outline" size={16} color="#007BFF" /> Email
              </Text>
              <TextInput
                style={[styles.input, errors.email && styles.errorInput]}
                placeholder="Digite su email..."
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {errors.email ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#dc3545" />
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color="#007BFF"
                />{" "}
                {isRegister ? "Contraseña actual" : "Contraseña"}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, errors.password && styles.errorInput]}
                  placeholder={
                    isRegister
                      ? "Digite su contraseña actual..."
                      : "Digite su contraseña..."
                  }
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#007BFF"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#dc3545" />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              ) : null}
            </View>

            {isRegister && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    <Ionicons name="key-outline" size={16} color="#007BFF" />{" "}
                    Nueva contraseña
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.newPassword && styles.errorInput,
                      ]}
                      placeholder="Digite nueva contraseña..."
                      secureTextEntry={!showNewPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      autoComplete="new-password"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showNewPassword ? "eye-off" : "eye"}
                        size={24}
                        color="#007BFF"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.newPassword ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#dc3545" />
                      <Text style={styles.errorText}>{errors.newPassword}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color="#007BFF"
                    />{" "}
                    Confirmar nueva contraseña
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.confirmPassword && styles.errorInput,
                      ]}
                      placeholder="Confirme nueva contraseña..."
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoComplete="new-password"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={24}
                        color="#007BFF"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#dc3545" />
                      <Text style={styles.errorText}>
                        {errors.confirmPassword}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isRegister ? (
                  <>
                    <Ionicons name="create-outline" size={18} color="white" />{" "}
                    Actualizar contraseña
                  </>
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={18} color="white" />{" "}
                    Iniciar sesión
                  </>
                )}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                {isRegister
                  ? "¿Ya tienes cuenta? "
                  : "¿Primera vez en la plataforma? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsRegister(!isRegister);
                  setErrors({
                    email: "",
                    password: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}>
                  {isRegister ? "Inicia sesión aquí" : "Registra tu contraseña"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#007BFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  image: {
    width: 120,
    height: 120,
    opacity: 0.8,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: "#007BFF",
    marginBottom: 10,
    fontWeight: "600",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    borderWidth: 2,
    borderColor: "#e9ecef",
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  errorInput: {
    borderColor: "#dc3545",
    backgroundColor: "#fff8f8",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
    flex: 1,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 18,
    padding: 8,
    zIndex: 1,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
    shadowColor: "#007BFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#6c757d",
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flexDirection: "row",
    alignItems: "center",
  },
  registerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  registerText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  registerLink: {
    color: "#007BFF",
    fontWeight: "bold",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
