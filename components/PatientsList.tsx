import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { axiosApi } from "../app/axiosApi/axiosApi";
import Loader from "./Loader";

interface Patient {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  birthdate: string;
  color: string;
  allergies?: string;
  status: string;
}

interface PatientsListProps {
  userId: string;
  onPatientSelect?: (patient: Patient) => void;
  onAddPatient?: () => void;
  onLogout?: () => void;
}

const PatientsList: React.FC<PatientsListProps> = ({
  userId,
  onPatientSelect,
  onAddPatient,
  onLogout,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    try {
      setError(null);
      const response = await axiosApi.get(`/patients/owner/${userId}`);
      if (response.data.success) {
        setPatients(response.data.data || []);
      } else {
        setPatients([]);
        // No mostrar error si simplemente no hay pacientes
      }
    } catch (error: any) {
      console.error("Error fetching patients:", error);
      if (error.response?.status === 404 || error.response?.status === 400) {
        // Usuario no tiene pacientes, no es un error real
        setPatients([]);
        setError(null);
      } else {
        setError("Error al cargar los pacientes");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const handleCallClinic = () => {
    const phoneNumber = "tel:60302976";
    Linking.openURL(phoneNumber).catch((err) =>
      console.error("Error al intentar hacer la llamada:", err),
    );
  };

  const getSpeciesIcon = (species: string) => {
    const lowerSpecies = species.toLowerCase();
    if (lowerSpecies.includes("perro") || lowerSpecies.includes("dog")) {
      return "paw";
    } else if (lowerSpecies.includes("gato") || lowerSpecies.includes("cat")) {
      return "heart";
    } else if (lowerSpecies.includes("ave") || lowerSpecies.includes("bird")) {
      return "airplane";
    } else {
      return "leaf";
    }
  };

  const getAgeText = (age: number) => {
    return age === 1 ? "1 año" : `${age} años`;
  };

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return "Edad desconocida";

    const birth = new Date(birthdate);
    const today = new Date();
    const ageInMonths =
      (today.getFullYear() - birth.getFullYear()) * 12 +
      today.getMonth() -
      birth.getMonth();

    if (ageInMonths < 12) {
      return `${ageInMonths} ${ageInMonths === 1 ? "mes" : "meses"}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      if (months === 0) {
        return getAgeText(years);
      }
      return `${years} ${years === 1 ? "año" : "años"} y ${months} ${months === 1 ? "mes" : "meses"}`;
    }
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => onPatientSelect?.(item)}
    >
      <View style={styles.patientHeader}>
        <Ionicons
          name={getSpeciesIcon(item.species)}
          size={30}
          color="#007BFF"
        />
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.patientSpecies}>
            {item.species} - {item.breed}
          </Text>
        </View>
        <View style={styles.patientDetails}>
          <Text style={styles.patientAge}>{calculateAge(item.birthdate)}</Text>
          <Text style={styles.patientGender}>
            {item.gender?.toLowerCase() === "macho" ||
            item.gender?.toLowerCase() === "male"
              ? "♂"
              : "♀"}
          </Text>
        </View>
      </View>

      <View style={styles.patientMeta}>
        <Text style={styles.patientWeight}>{item.weight} kg</Text>
        <Text style={styles.patientColor}>{item.color}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status?.toLowerCase() === "activo" ||
                item.status?.toLowerCase() === "active"
                  ? "#d4edda"
                  : "#f8d7da",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status?.toLowerCase() === "activo" ||
                  item.status?.toLowerCase() === "active"
                    ? "#155724"
                    : "#721c24",
              },
            ]}
          >
            {item.status?.toLowerCase() === "activo" ||
            item.status?.toLowerCase() === "active"
              ? "Activo"
              : "Inactivo"}
          </Text>
        </View>
      </View>

      {item.allergies && (
        <View style={styles.allergiesContainer}>
          <Ionicons name="warning" size={16} color="#ffc107" />
          <Text style={styles.allergiesText}>Alergias: {item.allergies}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <Loader message="Cargando pacientes..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={50} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPatients}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Mascotas</Text>
          {onLogout && (
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={24} color="#dc3545" />
            </TouchableOpacity>
          )}
        </View>

        {patients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="paw-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No tienes mascotas registradas</Text>
            <Text style={styles.adminText}>
              Para registrar tu primera mascota, contacta a la clínica
            </Text>
            <TouchableOpacity
              style={styles.contactInfo}
              onPress={handleCallClinic}
            >
              <Ionicons name="call-outline" size={20} color="#007BFF" />
              <Text style={styles.contactText}>Llama a la clínica</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={patients}
            renderItem={renderPatientItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 0,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    padding: 8,
  },
  logoutButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#dc3545",
    shadowColor: "#dc3545",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  patientInfo: {
    flex: 1,
    marginLeft: 16,
  },
  patientName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  patientSpecies: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  patientDetails: {
    alignItems: "flex-end",
  },
  patientAge: {
    fontSize: 16,
    color: "#007BFF",
    fontWeight: "700",
  },
  patientGender: {
    fontSize: 20,
    color: "#007BFF",
    marginTop: 4,
  },
  patientMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f1f1",
  },
  patientWeight: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  patientColor: {
    fontSize: 16,
    color: "#666",
    textTransform: "capitalize",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
  },
  allergiesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  allergiesText: {
    fontSize: 14,
    color: "#856404",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 16,
    fontWeight: "600",
  },
  adminText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f7ff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007BFF",
    shadowColor: "#007BFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactText: {
    fontSize: 16,
    color: "#007BFF",
    marginLeft: 12,
    fontWeight: "700",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: "#dc3545",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 24,
    lineHeight: 26,
  },
  retryButton: {
    backgroundColor: "#007BFF",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#007BFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default PatientsList;
