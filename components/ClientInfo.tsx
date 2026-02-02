import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Client {
  cedula: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  registrationdate: string;
  status: string;
}

interface ClientInfoProps {
  client: Client;
  onEditProfile?: () => void;
  onLogout?: () => void;
}

const ClientInfo: React.FC<ClientInfoProps> = ({
  client,
  onEditProfile,
  onLogout,
}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={80} color="#007BFF" />
        <Text style={styles.name}>{client.name}</Text>
        <Text style={styles.subtitle}>
          Cliente desde {new Date(client.registrationdate).getFullYear()}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="id-card-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Cédula:</Text>
          <Text style={styles.infoValue}>{client.cedula}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{client.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Teléfono:</Text>
          <Text style={styles.infoValue}>{client.phone}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Dirección:</Text>
          <Text style={styles.infoValue}>{client.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Ciudad:</Text>
          <Text style={styles.infoValue}>{client.city}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name={
              client.status === "active" ? "checkmark-circle" : "close-circle"
            }
            size={20}
            color={client.status === "active" ? "#28a745" : "#dc3545"}
          />
          <Text style={styles.infoLabel}>Estado:</Text>
          <Text
            style={[
              styles.infoValue,
              { color: client.status === "active" ? "#28a745" : "#dc3545" },
            ]}
          >
            {client.status === "active" ? "Activo" : "Inactivo"}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onEditProfile && (
          <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
            <Ionicons name="create-outline" size={20} color="#007BFF" />
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        )}

        {onLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc3545" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  infoSection: {
    padding: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 16,
    width: 100,
  },
  infoValue: {
    fontSize: 18,
    color: "#666",
    flex: 1,
  },
  actions: {
    padding: 24,
    gap: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007BFF",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#007BFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  editButtonText: {
    color: "#007BFF",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#dc3545",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#dc3545",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    color: "#dc3545",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
});

export default ClientInfo;
