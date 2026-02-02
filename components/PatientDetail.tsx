import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { axiosApi } from "../app/axiosApi/axiosApi";

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
  created_date: string;
  updated_date: string;
}

interface Appointment {
  id: number;
  patientId: number;
  date: string;
  time: string;
  type: string;
  veterinarian: string;
  status: string;
  notes?: string;
}

interface PatientDetailProps {
  patient: Patient;
  onEdit?: () => void;
  onBookAppointment?: () => void;
  onViewHistory?: () => void;
  onBack?: () => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({
  patient,
  onEdit,
  onBookAppointment,
  onViewHistory,
  onBack,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [patient.id]);

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);

      if (!patient?.id) {
        console.log("No patient ID available");
        setAppointments([]);
        return;
      }

      const response = await axiosApi.get(
        `/appointments/patient/${patient.id}`,
      );

      if (!response.data || !response.data.data) {
        console.log("No appointment data received");
        setAppointments([]);
        return;
      }

      const allAppointments = response.data.data || [];
      console.log(
        `Loaded ${allAppointments.length} appointments for patient ${patient.id}`,
      );

      // Filtrar solo citas programadas y futuras
      const now = new Date();
      const upcomingAppointments = allAppointments
        .filter((apt: Appointment) => {
          try {
            if (!apt.date || !apt.time || !apt.status) {
              console.log("Invalid appointment data:", apt);
              return false;
            }
            const aptDate = new Date(`${apt.date}T${apt.time}`);
            return apt.status === "Programada" && aptDate >= now;
          } catch (error) {
            console.error("Error processing appointment:", apt, error);
            return false;
          }
        })
        .sort((a: Appointment, b: Appointment) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

      setAppointments(upcomingAppointments.slice(0, 3)); // Mostrar solo las 3 próximas
    } catch (error: any) {
      console.error("Error loading appointments:", error);
      console.error("Error details:", error.response?.data);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
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

  const formatDate = (dateString: string) => {
    // Evitar conversión de zona horaria parseando la fecha manualmente
    const [year, month, day] = dateString.split("T")[0].split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAgeText = (age: number) => {
    return age === 1 ? "1 año" : `${age} años`;
  };

  const calculateAge = (birthdate: string) => {
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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#007BFF" />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Ionicons
            name={getSpeciesIcon(patient.species)}
            size={60}
            color="#007BFF"
          />
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientSpecies}>
            {patient.species} - {patient.breed}
          </Text>
        </View>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Ionicons name="calendar-outline" size={24} color="#007BFF" />
            <Text style={styles.infoLabel}>Edad</Text>
            <Text style={styles.infoValue}>
              {calculateAge(patient.birthdate)}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="scale-outline" size={24} color="#007BFF" />
            <Text style={styles.infoLabel}>Peso</Text>
            <Text style={styles.infoValue}>{patient.weight} kg</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Ionicons
              name={
                patient.gender?.toLowerCase() === "macho" ||
                patient.gender?.toLowerCase() === "male"
                  ? "male"
                  : "female"
              }
              size={24}
              color={
                patient.gender?.toLowerCase() === "macho" ||
                patient.gender?.toLowerCase() === "male"
                  ? "#007BFF"
                  : "#e91e63"
              }
            />
            <Text style={styles.infoLabel}>Sexo</Text>
            <Text style={styles.infoValue}>
              {patient.gender?.toLowerCase() === "macho" ||
              patient.gender?.toLowerCase() === "male"
                ? "Macho"
                : "Hembra"}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="color-palette-outline" size={24} color="#007BFF" />
            <Text style={styles.infoLabel}>Color</Text>
            <Text style={styles.infoValue}>{patient.color}</Text>
          </View>
        </View>
      </View>

      {/* Detailed Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles</Text>

        <View style={styles.detailRow}>
          <Ionicons name="gift-outline" size={20} color="#666" />
          <Text style={styles.detailLabel}>Fecha de nacimiento:</Text>
          <Text style={styles.detailValue}>
            {formatDate(patient.birthdate)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons
            name={
              patient.status?.toLowerCase() === "activo" ||
              patient.status?.toLowerCase() === "active"
                ? "checkmark-circle"
                : "close-circle"
            }
            size={20}
            color={
              patient.status?.toLowerCase() === "activo" ||
              patient.status?.toLowerCase() === "active"
                ? "#28a745"
                : "#dc3545"
            }
          />
          <Text style={styles.detailLabel}>Estado:</Text>
          <Text
            style={[
              styles.detailValue,
              {
                color:
                  patient.status?.toLowerCase() === "activo" ||
                  patient.status?.toLowerCase() === "active"
                    ? "#28a745"
                    : "#dc3545",
              },
            ]}
          >
            {patient.status?.toLowerCase() === "activo" ||
            patient.status?.toLowerCase() === "active"
              ? "Activo"
              : "Inactivo"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.detailLabel}>Registrado:</Text>
          <Text style={styles.detailValue}>
            {formatDate(patient.created_date)}
          </Text>
        </View>
      </View>

      {/* Allergies Section */}
      {patient.allergies && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alergias y Condiciones</Text>
          <View style={styles.allergiesContainer}>
            <Ionicons name="warning" size={20} color="#ffc107" />
            <Text style={styles.allergiesText}>{patient.allergies}</Text>
          </View>
        </View>
      )}

      {/* Upcoming Appointments Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Citas Próximas</Text>
        {loadingAppointments ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007BFF" />
            <Text style={styles.loadingText}>Cargando citas...</Text>
          </View>
        ) : appointments.length > 0 ? (
          appointments.map((apt) => (
            <View key={apt.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.appointmentDateBadge}>
                  <Ionicons name="calendar-outline" size={16} color="#fff" />
                  <Text style={styles.appointmentDateText}>
                    {(() => {
                      // Evitar conversión de zona horaria
                      const [year, month, day] = apt.date
                        .split("T")[0]
                        .split("-");
                      const date = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day),
                      );
                      return date.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      });
                    })()}
                  </Text>
                </View>
                <View style={styles.appointmentTypeBadge}>
                  <Text style={styles.appointmentTypeText}>{apt.type}</Text>
                </View>
              </View>
              <View style={styles.appointmentBody}>
                <View style={styles.appointmentRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.appointmentDetail}>{apt.time}</Text>
                </View>
                <View style={styles.appointmentRow}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.appointmentDetail}>
                    Dr(a). {apt.veterinarian}
                  </Text>
                </View>
                {apt.notes && (
                  <View style={styles.appointmentRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.appointmentDetail} numberOfLines={2}>
                      {apt.notes}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noAppointmentsContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.noAppointmentsText}>
              No hay citas programadas
            </Text>
            <Text style={styles.noAppointmentsSubtext}>
              Agenda una cita para tu mascota
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {onBookAppointment && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={onBookAppointment}
          >
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Agendar Cita</Text>
          </TouchableOpacity>
        )}

        <View style={styles.secondaryActions}>
          {onViewHistory && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onViewHistory}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#007BFF"
              />
              <Text style={styles.secondaryButtonText}>Historial</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    marginTop: 10,
    marginBottom: 10,
  },
  headerContent: {
    alignItems: "center",
  },
  patientName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  patientSpecies: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
    width: 140,
  },
  detailValue: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  allergiesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  allergiesText: {
    fontSize: 14,
    color: "#856404",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#007BFF",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007BFF",
    flex: 1,
    marginHorizontal: 4,
  },
  secondaryButtonText: {
    color: "#007BFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#666",
  },
  appointmentCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007BFF",
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  appointmentDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007BFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  appointmentDateText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    textTransform: "capitalize",
  },
  appointmentTypeBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007BFF",
  },
  appointmentTypeText: {
    color: "#007BFF",
    fontSize: 12,
    fontWeight: "600",
  },
  appointmentBody: {
    gap: 8,
  },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  appointmentDetail: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  noAppointmentsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noAppointmentsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginTop: 12,
  },
  noAppointmentsSubtext: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 4,
  },
});

export default PatientDetail;
