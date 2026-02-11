import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { axiosApi } from "../app/axiosApi/axiosApi";
import { useTheme } from "../contexts/ThemeContext";

interface User {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

interface UserStats {
  totalPatients?: number;
  totalAppointments?: number;
  upcomingAppointments?: number;
  memberSince?: string;
}

interface UserInfoProps {
  user: User;
  stats?: UserStats;
  onBack?: () => void;
  onLogout?: () => void;
}

const COLORS = [
  { name: "Azul", value: "#007BFF" },
  { name: "Verde", value: "#28a745" },
  { name: "Morado", value: "#6f42c1" },
  { name: "Naranja", value: "#fd7e14" },
  { name: "Rosado", value: "#df00f3" },
  { name: "Turquesa", value: "#20c997" },
  { name: "Negro", value: "#000000" },
  { name: "Índigo", value: "#6610f2" },
];

const UserInfo: React.FC<UserInfoProps> = ({
  user,
  stats,
  onBack,
  onLogout,
}) => {
  const { themeColor, setThemeColor } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const saveColor = async (color: string) => {
    try {
      await setThemeColor(color);
    } catch (error) {
      console.error("Error saving color:", error);
      Alert.alert("Error", "No se pudo guardar el color");
    }
  };

  const getUserRank = () => {
    const totalCitas = stats?.totalAppointments || 0;

    if (totalCitas >= 50) {
      return { name: "VIP Platino", icon: "trophy", color: "#E5E4E2" };
    } else if (totalCitas >= 30) {
      return { name: "VIP Oro", icon: "medal", color: "#FFD700" };
    } else if (totalCitas >= 15) {
      return { name: "VIP Plata", icon: "ribbon", color: "#C0C0C0" };
    } else if (totalCitas >= 5) {
      return { name: "VIP Bronce", icon: "star", color: "#CD7F32" };
    } else {
      return { name: "Nuevo Cliente", icon: "heart", color: "#ffc107" };
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas nuevas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      Alert.alert("Error", "La contraseña debe tener al menos una mayúscula");
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      Alert.alert(
        "Error",
        "La contraseña debe tener al menos un carácter especial",
      );
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await axiosApi.put(
        "/auth/profile",
        {
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          currentPassword: currentPassword,
          newPassword: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        Alert.alert("Éxito", "Contraseña actualizada correctamente");
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert(
          "Error",
          response.data.message || "No se pudo actualizar la contraseña",
        );
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Error al cambiar la contraseña",
      );
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const rank = getUserRank();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={themeColor} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Botón de retroceso */}
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={themeColor} />
            <Text style={[styles.backButtonText, { color: themeColor }]}>
              Volver
            </Text>
          </TouchableOpacity>
        )}

        {/* Header con gradiente */}
        <View style={styles.headerContainer}>
          <View
            style={[styles.headerGradient, { backgroundColor: themeColor }]}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={60} color="#fff" />
              </View>
            </View>
            <Text style={styles.userName}>{user.nombre}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.memberBadge}>
              <Ionicons name={rank.icon as any} size={16} color={rank.color} />
              <Text style={styles.memberBadgeText}>{rank.name}</Text>
              <Text style={styles.memberBadgeSubtext}>
                {stats?.totalAppointments || 0} citas completadas
              </Text>
            </View>
          </View>
        </View>

        {/* Estadísticas */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="paw" size={24} color={themeColor} />
              <Text style={styles.statNumber}>{stats.totalPatients || 0}</Text>
              <Text style={styles.statLabel}>Mascotas</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={24} color={themeColor} />
              <Text style={styles.statNumber}>
                {stats.totalAppointments || 0}
              </Text>
              <Text style={styles.statLabel}>Citas Total</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color={themeColor} />
              <Text style={styles.statNumber}>
                {stats.upcomingAppointments || 0}
              </Text>
              <Text style={styles.statLabel}>Próximas</Text>
            </View>
          </View>
        )}

        {/* Información del perfil */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.infoIconContainer,
                  { backgroundColor: `${themeColor}15` },
                ]}
              >
                <Ionicons name="person-outline" size={22} color={themeColor} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nombre Completo</Text>
                <Text style={styles.infoValue}>{user.nombre}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View
                style={[
                  styles.infoIconContainer,
                  { backgroundColor: `${themeColor}15` },
                ]}
              >
                <Ionicons name="mail-outline" size={22} color={themeColor} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Correo Electrónico</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>

            {user.telefono && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View
                    style={[
                      styles.infoIconContainer,
                      { backgroundColor: `${themeColor}15` },
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={22}
                      color={themeColor}
                    />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>{user.telefono}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View
                style={[
                  styles.infoIconContainer,
                  { backgroundColor: `${themeColor}15` },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={themeColor}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Miembro Desde</Text>
                <Text style={styles.infoValue}>
                  {formatDate(user.fecha_creacion)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Selector de Color */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Color de Tema</Text>
          <View style={styles.colorPickerContainer}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color.value}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: color.value,
                    borderWidth: themeColor === color.value ? 3 : 0,
                    borderColor: "#fff",
                    shadowColor:
                      themeColor === color.value ? color.value : "#000",
                  },
                ]}
                onPress={() => saveColor(color.value)}
                activeOpacity={0.7}
              >
                {themeColor === color.value && (
                  <Ionicons name="checkmark" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Acción: Cambiar Contraseña */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowPasswordModal(true)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${themeColor}15` },
                ]}
              >
                <Ionicons name="key-outline" size={24} color={themeColor} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Cambiar Contraseña</Text>
                <Text style={styles.actionDescription}>
                  Actualiza tu contraseña de acceso
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón de cerrar sesión */}
        {onLogout && (
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: themeColor }]}
              onPress={onLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={24} color="#fff" />
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacing} />

        {/* Modal de Cambio de Contraseña */}
        <Modal
          visible={showPasswordModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
                <TouchableOpacity
                  onPress={() => setShowPasswordModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.inputLabel}>Contraseña Actual</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Ingresa tu contraseña actual"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Nueva Contraseña</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 especial"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>
                  Confirmar Nueva Contraseña
                </Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite la nueva contraseña"
                  placeholderTextColor="#999"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowPasswordModal(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.saveButton,
                      { backgroundColor: themeColor },
                    ]}
                    onPress={handleChangePassword}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {loading ? "Guardando..." : "Guardar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginLeft: 10,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007BFF",
    fontWeight: "600",
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerGradient: {
    backgroundColor: "#007BFF",
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 15,
    textAlign: "center",
  },
  memberBadge: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  memberBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  memberBadgeSubtext: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  actionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: "#999",
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc3545",
    borderRadius: 15,
    padding: 18,
    gap: 10,
    shadowColor: "#dc3545",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  colorPickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 25,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#007BFF",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 30,
  },
});

export default UserInfo;
