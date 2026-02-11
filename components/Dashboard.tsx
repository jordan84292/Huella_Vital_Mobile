import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { Alert, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { axiosApi } from "../app/axiosApi/axiosApi";
import { useTheme } from "../contexts/ThemeContext";
import AppointmentBooking from "./AppointmentBooking";
import Loader from "./Loader";
import PatientDetail from "./PatientDetail";
import PatientsList from "./PatientsList";
import PatientTimeline from "./PatientTimeline";
import UserInfo from "./UserInfo";

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
  const [userStats, setUserStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    upcomingAppointments: 0,
  });
  const [navigation, setNavigation] = useState<NavigationState>({
    screen: "patients",
  });
  const { themeColor } = useTheme();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      checkTodayAppointments();
      loadUserStats();
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
        return;
      }

      // Obtener todos los pacientes del cliente
      const patientsResponse = await axiosApi.get("/patients");
      const allPatients = patientsResponse.data.data || [];
      const userPatients = allPatients.filter(
        (p: any) => String(p.cedula) === String(client.cedula),
      );

      if (userPatients.length === 0) {
        return;
      }

      // Obtener fecha de hoy en formato YYYY-MM-DD usando fecha local
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;

      let todayAppointments: any[] = [];

      // Para cada paciente, obtener sus citas
      for (const patient of userPatients) {
        try {
          const appointmentsResponse = await axiosApi.get(
            `/appointments/patient/${patient.id}`,
          );
          const appointments = appointmentsResponse.data.data || [];

          // Filtrar citas de hoy que estén programadas
          const todayApts = appointments.filter((apt: any) => {
            const aptDateStr = apt.date.split("T")[0]; // Extraer solo la fecha

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

      if (todayAppointments.length > 0) {
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

  const loadUserStats = async () => {
    try {
      if (!user?.email) return;

      // Obtener el cliente actual por email
      const clientResponse = await axiosApi.get("/clients");
      const clients = clientResponse.data.data || [];
      const client = clients.find((c: any) => c.email === user.email);

      if (!client) {
        return;
      }

      // Obtener todos los pacientes del cliente
      const patientsResponse = await axiosApi.get("/patients");
      const allPatients = patientsResponse.data.data || [];
      const userPatients = allPatients.filter(
        (p: any) => String(p.cedula) === String(client.cedula),
      );

      let totalAppointments = 0;
      let upcomingAppointments = 0;
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas

      // Para cada paciente, obtener sus citas
      for (const patient of userPatients) {
        try {
          const appointmentsResponse = await axiosApi.get(
            `/appointments/patient/${patient.id}`,
          );
          const appointments = appointmentsResponse.data.data || [];

          // Contar todas las citas completadas
          const completedAppointments = appointments.filter(
            (apt: any) => apt.status === "Completada",
          );
          totalAppointments += completedAppointments.length;

          // Contar citas futuras programadas
          const upcoming = appointments.filter((apt: any) => {
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate >= now && apt.status === "Programada";
          });
          upcomingAppointments += upcoming.length;
        } catch (error) {
          console.error(
            `Error loading appointments for patient ${patient.id}:`,
            error,
          );
        }
      }

      setUserStats({
        totalPatients: userPatients.length,
        totalAppointments,
        upcomingAppointments,
      });
    } catch (error) {
      console.error("Error loading user stats:", error);
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

  const handleViewProfile = () => {
    setNavigation({ screen: "profile" });
  };

  if (loading) {
    return <Loader message="Cargando información..." color={themeColor} />;
  }

  if (!user) {
    return (
      <Loader message="Error al cargar datos del usuario" color={themeColor} />
    );
  }

  const renderCurrentScreen = () => {
    switch (navigation.screen) {
      case "profile":
        return (
          <UserInfo
            user={user}
            stats={{
              totalPatients: userStats.totalPatients,
              totalAppointments: userStats.totalAppointments,
              upcomingAppointments: userStats.upcomingAppointments,
              memberSince: user.fecha_creacion,
            }}
            onBack={handleBackToPatients}
            onLogout={handleLogout}
          />
        );

      case "patients":
        return (
          <PatientsList
            userId={user.id.toString()}
            onPatientSelect={handlePatientSelect}
            onViewProfile={handleViewProfile}
            onLogout={handleLogout}
            themeColor={themeColor}
          />
        );

      case "patientDetail":
        return (
          <PatientDetail
            patient={navigation.patient}
            onBack={handleBackToPatients}
            onBookAppointment={() => handleBookAppointment(navigation.patient)}
            onViewHistory={() => handleViewHistory(navigation.patient)}
            themeColor={themeColor}
          />
        );

      case "patientTimeline":
        return (
          <PatientTimeline
            patientId={navigation.patient.id}
            onBack={handleBackToPatients}
            themeColor={themeColor}
          />
        );

      case "appointmentBooking":
        return (
          <AppointmentBooking
            patient={navigation.patient}
            onBack={handleBackToPatients}
            onSuccess={handleBackToPatients}
            themeColor={themeColor}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {renderCurrentScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
});

export default Dashboard;
