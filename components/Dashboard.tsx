import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { axiosApi } from "../app/axiosApi/axiosApi";
import Loader from "./Loader";
import ClientInfo from "./ClientInfo";
import PatientsList from "./PatientsList";
import PatientDetail from "./PatientDetail";
import PatientTimeline from "./PatientTimeline";
import AppointmentBooking from "./AppointmentBooking";

interface User {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

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

type NavigationState =
  | { screen: "profile" }
  | { screen: "patients" }
  | { screen: "patientDetail"; patient: Patient }
  | { screen: "patientTimeline"; patient: Patient }
  | { screen: "appointmentBooking"; patient: Patient };

interface DashboardProps {
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigation, setNavigation] = useState<NavigationState>({
    screen: "patients",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      checkTodayAppointments();
    }
  }, [user]);

  const checkTodayAppointments = async () => {
    try {
      if (!user?.email) return;

      // Obtener el cliente actual por email
      const clientResponse = await axiosApi.get("/clients");
      const clients = clientResponse.data.data || [];
      const client = clients.find((c: any) => c.email === user.email);

      if (!client) {
        console.log("No se encontró cliente para este usuario");
        return;
      }

      // Obtener todos los pacientes del cliente
      const patientsResponse = await axiosApi.get("/patients");
      const allPatients = patientsResponse.data.data || [];
      const userPatients = allPatients.filter(
        (p: any) => String(p.cedula) === String(client.cedula),
      );

      if (userPatients.length === 0) {
        console.log("No se encontraron pacientes para este cliente");
        return;
      }

      // Obtener fecha de hoy en formato YYYY-MM-DD usando fecha local
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;
      console.log("Fecha de hoy (local):", todayStr);
      console.log(
        "Zona horaria:",
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      );

      let todayAppointments: any[] = [];

      // Para cada paciente, obtener sus citas
      for (const patient of userPatients) {
        try {
          const appointmentsResponse = await axiosApi.get(
            `/appointments/patient/${patient.id}`,
          );
          const appointments = appointmentsResponse.data.data || [];
          console.log(
            `Citas del paciente ${patient.name}:`,
            appointments.length,
          );

          // Filtrar citas de hoy que estén programadas
          const todayApts = appointments.filter((apt: any) => {
            const aptDateStr = apt.date.split("T")[0]; // Extraer solo la fecha
            console.log(
              `Comparando: ${aptDateStr} === ${todayStr}, status: ${apt.status}`,
            );
            return aptDateStr === todayStr && apt.status === "Programada";
          });

          // Agregar el nombre del paciente a cada cita
          todayAppointments = [
            ...todayAppointments,
            ...todayApts.map((apt: any) => ({
              ...apt,
              patientName: patient.name,
            })),
          ];
        } catch (error) {
          console.error(
            `Error loading appointments for patient ${patient.id}:`,
            error,
          );
        }
      }

      // Mostrar notificación si hay citas hoy
      console.log(`Total de citas para hoy: ${todayAppointments.length}`);

      if (todayAppointments.length > 0) {
        console.log("Mostrando alerta de citas");

        // Calcular tiempo restante para cada cita
        const appointmentsList = todayAppointments
          .map((apt) => {
            const now = new Date();
            const [hours, minutes] = apt.time.split(":");
            const appointmentTime = new Date();
            appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const diffMs = appointmentTime.getTime() - now.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor(
              (diffMs % (1000 * 60 * 60)) / (1000 * 60),
            );

            let timeRemaining = "";
            if (diffMs > 0) {
              if (diffHours > 0) {
                timeRemaining = ` (en ${diffHours}h ${diffMinutes}m)`;
              } else if (diffMinutes > 0) {
                timeRemaining = ` (en ${diffMinutes} minutos)`;
              } else {
                timeRemaining = " (¡AHORA!)";
              }
            } else {
              timeRemaining = " (Ya pasó)";
            }

            return `• ${apt.patientName} - ${apt.time}${timeRemaining}\n  ${apt.type} con ${apt.veterinarian}`;
          })
          .join("\n\n");

        Alert.alert(
          "🔔 Recordatorio de Citas",
          `¡Tienes ${todayAppointments.length} cita${todayAppointments.length > 1 ? "s" : ""} programada${todayAppointments.length > 1 ? "s" : ""} para hoy!\n\n${appointmentsList}`,
          [{ text: "Entendido", style: "default" }],
        );
      }
    } catch (error: any) {
      console.error("Error checking today's appointments:", error);
      console.error("Error details:", error.response?.data);
      // No mostrar alert al usuario, solo log en consola
    }
  };

  const loadUserData = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const userData = await SecureStore.getItemAsync("userData");

      if (token && userData) {
        const userInfo = JSON.parse(userData);

        // Set axios default header
        axiosApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Check if a client exists with the same email, if not create one
        await ensureClientExists(userInfo);

        // Use the user data directly from the stored data
        setUser(userInfo);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const ensureClientExists = async (userInfo: User) => {
    try {
      // Check if client exists with same email
      const clientResponse = await axiosApi.get(`/clients`);
      const clients = clientResponse.data.data || [];
      const existingClient = clients.find(
        (client: any) => client.email === userInfo.email,
      );

      if (!existingClient) {
        // Create a client record for this user
        const clientData = {
          cedula: userInfo.id.toString(), // Use user ID as cedula
          name: userInfo.nombre,
          email: userInfo.email,
          phone: userInfo.telefono,
          address: "No especificada",
          city: "No especificada",
          status: "Activo",
        };

        await axiosApi.post("/clients", clientData);
        console.log("Cliente creado automáticamente para el usuario");
      }
    } catch (error) {
      console.error("Error ensuring client exists:", error);
      // Don't throw, just log - the app can still work without this
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("authToken");
      await SecureStore.deleteItemAsync("userData");
      // Reset axios authorization header
      delete axiosApi.defaults.headers.common["Authorization"];
      // Reset local state
      setUser(null);
      // Call parent logout callback to reset authentication state
      onLogout?.();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setNavigation({ screen: "patientDetail", patient });
  };

  const handleBookAppointment = (patient: Patient) => {
    setNavigation({ screen: "appointmentBooking", patient });
  };

  const handleViewHistory = (patient: Patient) => {
    setNavigation({ screen: "patientTimeline", patient });
  };

  const handleBackToPatients = () => {
    setNavigation({ screen: "patients" });
  };

  const handleBackToProfile = () => {
    setNavigation({ screen: "profile" });
  };

  if (loading) {
    return <Loader message="Cargando información..." />;
  }

  if (!user) {
    return <Loader message="Error al cargar datos del usuario" />;
  }

  const renderCurrentScreen = () => {
    switch (navigation.screen) {
      case "profile":
        return (
          <ClientInfo
            client={{
              cedula: user.id.toString(),
              name: user.nombre,
              email: user.email,
              phone: user.telefono,
              address: "No especificada",
              city: "No especificada",
              registrationdate: user.fecha_creacion,
              status: "active",
            }}
            onEditProfile={() => {
              // TODO: Implement edit profile
              console.log("Edit profile");
            }}
            onLogout={handleLogout}
          />
        );

      case "patients":
        return (
          <PatientsList
            userId={user.id.toString()}
            onPatientSelect={handlePatientSelect}
            onLogout={handleLogout}
          />
        );

      case "patientDetail":
        return (
          <PatientDetail
            patient={navigation.patient}
            onBack={handleBackToPatients}
            onEdit={() => {
              // TODO: Implement edit patient
              console.log("Edit patient");
            }}
            onBookAppointment={() => handleBookAppointment(navigation.patient)}
            onViewHistory={() => handleViewHistory(navigation.patient)}
          />
        );

      case "patientTimeline":
        return (
          <PatientTimeline
            patientId={navigation.patient.id}
            onBack={handleBackToPatients}
          />
        );

      case "appointmentBooking":
        return (
          <AppointmentBooking
            patient={navigation.patient}
            onBack={handleBackToPatients}
            onSuccess={handleBackToPatients}
          />
        );

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderCurrentScreen()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Dashboard;
