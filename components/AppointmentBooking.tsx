import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
  themeColor?: string;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  patient,
  onBack,
  onSuccess,
  themeColor = "#007BFF",
}) => {
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [veterinarian, setVeterinarian] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  const [loadingVets, setLoadingVets] = useState(true);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const appointmentTypes = [
    { value: "Consulta", label: "Consulta", icon: "medical-outline" },
    {
      value: "Vacunación",
      label: "Vacunación",
      icon: "shield-checkmark-outline",
    },
    { value: "Control", label: "Control", icon: "checkmark-circle-outline" },
    { value: "Emergencia", label: "Emergencia", icon: "alert-circle-outline" },
  ];

  // Obtener fecha actual
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  // Función para obtener el número de días en un mes
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Obtener días del mes seleccionado
  const getMaxDay = () => {
    const monthNum = parseInt(selectedMonth || currentMonth.toString());
    return getDaysInMonth(monthNum, currentYear);
  };

  const maxDay = getMaxDay();

  // Generar días del mes según el mes seleccionado
  const days = Array.from({ length: maxDay }, (_, i) => (i + 1).toString());

  // Meses del año
  const allMonths = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  // Filtrar meses: solo mostrar desde el mes actual en adelante
  const months = allMonths.filter(
    (month) => parseInt(month.value) >= currentMonth,
  );

  // Calcular día mínimo permitido
  const getMinDay = () => {
    const selectedMonthNum = parseInt(selectedMonth || "01");
    // Si el mes seleccionado es el mes actual, el mínimo es el día actual
    if (selectedMonthNum === currentMonth) {
      return currentDay;
    }
    // Si es un mes futuro, el mínimo es 1
    return 1;
  };

  const minDay = getMinDay();

  // Generar años (año actual + 1)
  const years = [currentYear.toString(), (currentYear + 1).toString()];

  useEffect(() => {
    loadVeterinarians();
  }, []);

  // Actualizar día seleccionado cuando cambia el mes
  useEffect(() => {
    if (selectedMonth && selectedDay) {
      const monthNum = parseInt(selectedMonth);
      const dayNum = parseInt(selectedDay);
      const maxDayInMonth = getDaysInMonth(monthNum, currentYear);
      const minDayInMonth = monthNum === currentMonth ? currentDay : 1;

      // Si el día seleccionado excede el máximo del mes, ajustarlo al máximo
      if (dayNum > maxDayInMonth) {
        setSelectedDay(maxDayInMonth.toString());
      }
      // Si el día seleccionado es menor que el mínimo permitido, ajustarlo al mínimo
      else if (dayNum < minDayInMonth) {
        setSelectedDay(minDayInMonth.toString());
      }

      // Limpiar horas disponibles cuando cambia el mes
      setAvailableTimes([]);
      setSelectedTime("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Recargar horas automáticamente cuando cambian día, mes o veterinario
  useEffect(() => {
    const reloadTimes = async () => {
      // Si no hay veterinario, día o mes, limpiar las horas disponibles
      if (!veterinarian || !selectedDay || !selectedMonth) {
        setAvailableTimes([]);
        setSelectedTime("");
        return;
      }

      const dateString = `${currentYear}-${selectedMonth}-${selectedDay.padStart(2, "0")}`;
      setSelectedDate(dateString);
      setSelectedTime(""); // Limpiar hora seleccionada
      setLoadingTimes(true);

      try {
        const response = await axiosApi.get(
          `/booking/slots/available?veterinarian=${encodeURIComponent(veterinarian)}&date=${dateString}`,
        );

        if (response.data.data && response.data.data.availableSlots) {
          let slots = response.data.data.availableSlots.map(
            (slot: any) => slot.slot_time,
          );

          // Si es el día de hoy, filtrar solo horas posteriores a la hora actual
          const selectedMonthNum = parseInt(selectedMonth);
          const selectedDayNum = parseInt(selectedDay);
          const isToday =
            selectedMonthNum === currentMonth && selectedDayNum === currentDay;

          if (isToday) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            const currentTimeInMinutes = currentHour * 60 + currentMinutes;

            slots = slots.filter((timeSlot: string) => {
              // Parsear el slot de hora (formato puede ser "14:00" o "14:00:00")
              const [hours, minutes] = timeSlot.split(":").map(Number);
              const slotTimeInMinutes = hours * 60 + minutes;

              // Solo mostrar slots que sean al menos 1 hora después de la hora actual
              return slotTimeInMinutes > currentTimeInMinutes + 60;
            });
          }

          setAvailableTimes(slots);
        } else {
          setAvailableTimes([]);
        }
      } catch (error) {
        console.error("Error al recargar horas:", error);
        setAvailableTimes([]);
      } finally {
        setLoadingTimes(false);
      }
    };

    reloadTimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, selectedMonth, veterinarian]);

  const loadVeterinarians = async () => {
    try {
      setLoadingVets(true);
      const response = await axiosApi.get("/users");
      const users = response.data.data || [];

      // Filtrar solo usuarios con rol "2" (Veterinario)
      const vets = users.filter(
        (user: any) => user.rol === "2" || user.rol === 2,
      );

      setVeterinarians(vets);
    } catch (error) {
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

      if (error.response?.data?.error) {
        // Mensaje de error específico del servidor
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors) {
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
    return <Loader message="Agendando cita..." color={themeColor} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={themeColor} />
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            <Text style={styles.title}>Agendar Cita</Text>
            <Text style={styles.subtitle}>para {patient.name}</Text>
          </View>
        </View>

        {/* Patient Info */}
        <View style={styles.patientInfo}>
          <Ionicons name="paw" size={24} color={themeColor} />
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
                  selectedType === type.value && {
                    backgroundColor: themeColor,
                    borderColor: themeColor,
                  },
                ]}
                onPress={() => setSelectedType(type.value)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={selectedType === type.value ? "#fff" : themeColor}
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
                  veterinarian === vet.nombre && {
                    borderColor: themeColor,
                    backgroundColor: "#f0f7ff",
                  },
                ]}
                onPress={() => {
                  setVeterinarian(vet.nombre);
                  // Las horas se recargarán automáticamente por el useEffect
                }}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color={veterinarian === vet.nombre ? themeColor : "#666"}
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
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={themeColor}
                  />
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

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha</Text>

          {/* Día */}
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerLabel}>Día</Text>
            <View style={styles.datePickerControl}>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: themeColor }]}
                onPress={() => {
                  if (!selectedDay) {
                    setSelectedDay(minDay.toString());
                  } else {
                    const currentDayValue = parseInt(selectedDay);
                    const newDay =
                      currentDayValue > minDay ? currentDayValue - 1 : maxDay;
                    setSelectedDay(newDay.toString());
                  }
                }}
              >
                <Ionicons name="chevron-back" size={28} color={themeColor} />
              </TouchableOpacity>
              <View
                style={[styles.dateDisplay, { backgroundColor: themeColor }]}
              >
                <Text
                  style={[
                    styles.dateDisplayText,
                    !selectedDay && styles.placeholderText,
                  ]}
                >
                  {selectedDay || "--"}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: themeColor }]}
                onPress={() => {
                  if (!selectedDay) {
                    setSelectedDay(minDay.toString());
                  } else {
                    const currentDayValue = parseInt(selectedDay);
                    const newDay =
                      currentDayValue < maxDay ? currentDayValue + 1 : minDay;
                    setSelectedDay(newDay.toString());
                  }
                }}
              >
                <Ionicons name="chevron-forward" size={28} color={themeColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mes */}
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerLabel}>Mes</Text>
            <View style={styles.datePickerControl}>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: themeColor }]}
                onPress={() => {
                  if (!selectedMonth) {
                    setSelectedMonth(currentMonth.toString().padStart(2, "0"));
                  } else {
                    const selectedMonthValue = parseInt(selectedMonth);
                    const newMonth =
                      selectedMonthValue > currentMonth
                        ? selectedMonthValue - 1
                        : 12;
                    setSelectedMonth(newMonth.toString().padStart(2, "0"));
                  }
                }}
              >
                <Ionicons name="chevron-back" size={28} color={themeColor} />
              </TouchableOpacity>
              <View
                style={[styles.dateDisplay, { backgroundColor: themeColor }]}
              >
                <Text
                  style={[
                    styles.dateDisplayText,
                    !selectedMonth && styles.placeholderText,
                  ]}
                >
                  {selectedMonth
                    ? allMonths.find((m) => m.value === selectedMonth)?.label
                    : "------"}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: themeColor }]}
                onPress={() => {
                  if (!selectedMonth) {
                    setSelectedMonth(currentMonth.toString().padStart(2, "0"));
                  } else {
                    const selectedMonthValue = parseInt(selectedMonth);
                    const newMonth =
                      selectedMonthValue < 12
                        ? selectedMonthValue + 1
                        : currentMonth;
                    setSelectedMonth(newMonth.toString().padStart(2, "0"));
                  }
                }}
              >
                <Ionicons name="chevron-forward" size={28} color={themeColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Año */}
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerLabel}>Año</Text>
            <View style={styles.datePickerControl}>
              <View
                style={[styles.dateDisplay, { backgroundColor: themeColor }]}
              >
                <Text style={styles.dateDisplayText}>{currentYear}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horas Disponibles</Text>
          {loadingTimes ? (
            <View style={styles.loadingTimes}>
              <Text style={styles.loadingText}>
                Cargando horas disponibles...
              </Text>
            </View>
          ) : availableTimes.length > 0 ? (
            <View style={styles.timeGrid}>
              {availableTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeCard,
                    selectedTime === time && {
                      backgroundColor: themeColor,
                      borderColor: themeColor,
                    },
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
          ) : (
            <View style={styles.noTimes}>
              <Ionicons name="time-outline" size={40} color="#ccc" />
              <Text style={styles.noTimesText}>
                {!veterinarian
                  ? "Selecciona un veterinario primero"
                  : !selectedDay || !selectedMonth
                    ? "Selecciona una fecha completa"
                    : "No hay horas disponibles para esta fecha"}
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
          <View
            style={[
              styles.summary,
              {
                borderColor: themeColor,
                shadowColor: themeColor,
                backgroundColor: `${themeColor}08`,
              },
            ]}
          >
            <Text style={[styles.summaryTitle, { color: themeColor }]}>
              Resumen de la Cita
            </Text>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar" size={18} color={themeColor} />
              <Text style={styles.summaryText}>{selectedDate}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="time" size={18} color={themeColor} />
              <Text style={styles.summaryText}>{selectedTime}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="medical" size={18} color={themeColor} />
              <Text style={styles.summaryText}>
                {appointmentTypes.find((t) => t.value === selectedType)?.label}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="person" size={18} color={themeColor} />
              <Text style={styles.summaryText}>Dr(a). {veterinarian}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.bookButton,
            !selectedDate || !selectedTime || !selectedType || !veterinarian
              ? styles.disabledButton
              : {
                  backgroundColor: "#28a745",
                  shadowColor: "#28a745",
                },
          ]}
          onPress={handleBookAppointment}
          disabled={
            !selectedDate || !selectedTime || !selectedType || !veterinarian
          }
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.bookButtonText}>Agendar Cita</Text>
        </TouchableOpacity>
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
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    paddingBottom: 30,
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
    backgroundColor: "themeColor",
    borderColor: "themeColor",
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
  datePickerContainer: {
    marginBottom: 16,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  datePickerControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  dateButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "themeColor",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDisplay: {
    backgroundColor: "themeColor",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDisplayText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  placeholderText: {
    opacity: 0.5,
  },
  loadTimesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  disabledLoadButton: {
    backgroundColor: "#ccc",
  },
  loadTimesButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  loadingTimes: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  noTimes: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  noTimesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
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
    backgroundColor: "themeColor",
    borderColor: "themeColor",
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
    borderColor: "themeColor",
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
    color: "themeColor",
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
    margin: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
  },
  summaryText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    fontWeight: "600",
    flex: 1,
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    margin: 20,
    marginTop: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
