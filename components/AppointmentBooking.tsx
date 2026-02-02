import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { axiosApi } from "../app/axiosApi/axiosApi";
import Loader from "./Loader";

interface Patient {
  id: number;
  name: string;
  species: string;
  breed: string;
}

interface AppointmentBookingProps {
  patient: Patient;
  onBack?: () => void;
  onSuccess?: () => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  patient,
  onBack,
  onSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [veterinarian, setVeterinarian] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  const [loadingVets, setLoadingVets] = useState(true);

  const appointmentTypes = [
    { value: "Consulta", label: "Consulta", icon: "medical-outline" },
    {
      value: "Vacunación",
      label: "Vacunación",
      icon: "shield-checkmark-outline",
    },
    { value: "Cirugía", label: "Cirugía", icon: "cut-outline" },
    { value: "Control", label: "Control", icon: "checkmark-circle-outline" },
    { value: "Emergencia", label: "Emergencia", icon: "alert-circle-outline" },
  ];

  const timeSlots = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
  ];

  const getNextDays = (days: number) => {
    const dates = [];
    const today = new Date();
    console.log("Fecha actual:", today.toString());
    console.log(
      "Zona horaria:",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );

    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Usar la fecha local para evitar inconsistencias
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateValue = `${year}-${month}-${day}`;

      const weekday = date.toLocaleDateString("es-ES", { weekday: "long" });

      console.log(`Día ${i}: ${dateValue} - ${weekday} ${day}`);

      dates.push({
        value: dateValue,
        label: date.toLocaleDateString("es-ES", {
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
        full: date.toLocaleDateString("es-ES"),
      });
    }
    return dates;
  };

  const availableDates = getNextDays(14); // Próximos 14 días

  useEffect(() => {
    loadVeterinarians();
  }, []);

  const loadVeterinarians = async () => {
    try {
      setLoadingVets(true);
      const response = await axiosApi.get("/users");
      const users = response.data.data || [];
      console.log("Usuarios recibidos:", users);
      console.log("Primer usuario:", users[0]);
      // Filtrar solo usuarios con rol "2" (Veterinario)
      const vets = users.filter(
        (user: any) => user.rol === "2" || user.rol === 2,
      );
      console.log("Veterinarios filtrados:", vets);
      setVeterinarians(vets);
    } catch (error) {
      console.error("Error loading veterinarians:", error);
      Alert.alert("Error", "No se pudieron cargar los veterinarios");
    } finally {
      setLoadingVets(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !selectedType || !veterinarian) {
      Alert.alert("Error", "Por favor completa todos los campos requeridos");
      return;
    }

    setLoading(true);

    try {
      // Asegurar que la fecha esté en formato YYYY-MM-DD sin conversión de zona horaria
      const appointmentData = {
        patientId: patient.id,
        date: selectedDate, // Ya está en formato YYYY-MM-DD
        time: selectedTime,
        type: selectedType,
        veterinarian: veterinarian,
        notes: notes.trim() || null,
        status: "Programada",
      };

      console.log("Datos de la cita a enviar:", appointmentData);
      console.log("Fecha seleccionada:", selectedDate);
      console.log(
        "Zona horaria local:",
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      );

      const response = await axiosApi.post("/appointments", appointmentData);

      if (response.data.success) {
        Alert.alert(
          "¡Cita Agendada!",
          `La cita para ${patient.name} ha sido agendada exitosamente para el ${selectedDate} a las ${selectedTime}`,
          [
            {
              text: "OK",
              onPress: () => {
                onSuccess?.();
              },
            },
          ],
        );
      } else {
        Alert.alert(
          "Error",
          response.data.message || "No se pudo agendar la cita",
        );
      }
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      let errorMessage =
        "Ocurrió un error al agendar la cita. Por favor intenta de nuevo.";

      if (error.response?.data?.errors) {
        // Errores de validación
        const validationErrors = error.response.data.errors
          .map((err: any) => err.msg || err.message)
          .join("\n");
        errorMessage = `Errores de validación:\n${validationErrors}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Agendando cita..." />;
  }

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
          <Text style={styles.title}>Agendar Cita</Text>
          <Text style={styles.subtitle}>para {patient.name}</Text>
        </View>
      </View>

      {/* Patient Info */}
      <View style={styles.patientInfo}>
        <Ionicons name="paw" size={24} color="#007BFF" />
        <View style={styles.patientDetails}>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientMeta}>
            {patient.species} - {patient.breed}
          </Text>
        </View>
      </View>

      {/* Appointment Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipo de Cita</Text>
        <View style={styles.typeGrid}>
          {appointmentTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                selectedType === type.value && styles.selectedTypeCard,
              ]}
              onPress={() => setSelectedType(type.value)}
            >
              <Ionicons
                name={type.icon as any}
                size={24}
                color={selectedType === type.value ? "#fff" : "#007BFF"}
              />
              <Text
                style={[
                  styles.typeText,
                  selectedType === type.value && styles.selectedTypeText,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fecha</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.dateContainer}>
            {availableDates.map((date) => (
              <TouchableOpacity
                key={date.value}
                style={[
                  styles.dateCard,
                  selectedDate === date.value && styles.selectedDateCard,
                ]}
                onPress={() => setSelectedDate(date.value)}
              >
                <Text
                  style={[
                    styles.dateText,
                    selectedDate === date.value && styles.selectedDateText,
                  ]}
                >
                  {date.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hora</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeCard,
                selectedTime === time && styles.selectedTimeCard,
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text
                style={[
                  styles.timeText,
                  selectedTime === time && styles.selectedTimeText,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Veterinarian */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veterinario</Text>
        {loadingVets ? (
          <View style={styles.loadingVets}>
            <Text style={styles.loadingText}>Cargando veterinarios...</Text>
          </View>
        ) : veterinarians.length > 0 ? (
          veterinarians.map((vet) => (
            <TouchableOpacity
              key={vet.id}
              style={[
                styles.vetCard,
                veterinarian === vet.nombre && styles.selectedVetCard,
              ]}
              onPress={() => setVeterinarian(vet.nombre)}
            >
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={veterinarian === vet.nombre ? "#007BFF" : "#666"}
              />
              <Text
                style={[
                  styles.vetText,
                  veterinarian === vet.nombre && styles.selectedVetText,
                ]}
              >
                Dr(a). {vet.nombre}
              </Text>
              {veterinarian === vet.nombre && (
                <Ionicons name="checkmark-circle" size={24} color="#007BFF" />
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noVets}>
            <Text style={styles.noVetsText}>
              No hay veterinarios disponibles
            </Text>
          </View>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notas (Opcional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Describe síntomas, motivo de la cita o instrucciones especiales..."
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />
      </View>

      {/* Summary & Book Button */}
      {selectedDate && selectedTime && selectedType && veterinarian && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumen de la Cita</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.summaryText}>{selectedDate}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.summaryText}>{selectedTime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="medical" size={16} color="#666" />
            <Text style={styles.summaryText}>
              {appointmentTypes.find((t) => t.value === selectedType)?.label}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.summaryText}>{veterinarian}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.bookButton,
          (!selectedDate || !selectedTime || !selectedType || !veterinarian) &&
            styles.disabledButton,
        ]}
        onPress={handleBookAppointment}
        disabled={
          !selectedDate || !selectedTime || !selectedType || !veterinarian
        }
      >
        <Ionicons name="calendar-outline" size={20} color="#fff" />
        <Text style={styles.bookButtonText}>Agendar Cita</Text>
      </TouchableOpacity>
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
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    marginBottom: 16,
  },
  headerContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginTop: 8,
  },
  patientInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  patientDetails: {
    marginLeft: 16,
  },
  patientName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  patientMeta: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    minWidth: "47%",
  },
  selectedTypeCard: {
    backgroundColor: "#007BFF",
    borderColor: "#007BFF",
  },
  typeText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    fontWeight: "600",
  },
  selectedTypeText: {
    color: "#fff",
  },
  dateContainer: {
    flexDirection: "row",
    gap: 16,
    paddingRight: 20,
  },
  dateCard: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: "center",
  },
  selectedDateCard: {
    backgroundColor: "#007BFF",
    borderColor: "#007BFF",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
    textTransform: "capitalize",
  },
  selectedDateText: {
    color: "#fff",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  timeCard: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: "30%",
    alignItems: "center",
  },
  selectedTimeCard: {
    backgroundColor: "#007BFF",
    borderColor: "#007BFF",
  },
  timeText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  selectedTimeText: {
    color: "#fff",
  },
  vetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  selectedVetCard: {
    borderColor: "#007BFF",
    backgroundColor: "#f0f7ff",
  },
  vetText: {
    fontSize: 18,
    color: "#333",
    marginLeft: 16,
    flex: 1,
    fontWeight: "600",
  },
  selectedVetText: {
    color: "#007BFF",
    fontWeight: "700",
  },
  notesInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    minHeight: 120,
    lineHeight: 24,
  },
  summary: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 24,
    borderRadius: 16,
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
  summaryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    fontWeight: "600",
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007BFF",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    margin: 20,
    marginTop: 12,
    shadowColor: "#007BFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },
  loadingVets: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  noVets: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  noVetsText: {
    fontSize: 16,
    color: "#666",
  },
});

export default AppointmentBooking;
