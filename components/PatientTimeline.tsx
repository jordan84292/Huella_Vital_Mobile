import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { axiosApi } from "../app/axiosApi/axiosApi";

interface Visit {
  id: number;
  patient_id: number;
  date: string;
  diagnosis: string;
  treatment: string;
  type: string;
  notes: string;
  veterinarian: string;
  cost: number;
  created_date: string;
  updated_date: string;
}

interface Vaccination {
  id: number;
  patient_id: number;
  vaccine: string;
  date: string;
  veterinarian: string;
  dosis: number;
  next_dose_date?: string;
  created_date: string;
  updated_date: string;
}

interface TimelineProps {
  patientId: number;
  onBack: () => void;
}

type TimelineEvent = {
  eventType: "visit" | "vaccination";
  date: string;
  id: number;
} & (Visit | Vaccination);

const PatientTimeline: React.FC<TimelineProps> = ({ patientId, onBack }) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimelineData();
  }, [patientId]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [visitsResponse, vaccinationsResponse] = await Promise.all([
        axiosApi.get(`/visits/patient/${patientId}`),
        axiosApi.get(`/vaccinations/patient/${patientId}`),
      ]);

      setVisits(visitsResponse.data.data || []);
      setVaccinations(vaccinationsResponse.data.data || []);
    } catch (error) {
      console.error("Error loading timeline data:", error);
      setError("Error al cargar el historial médico");
    } finally {
      setLoading(false);
    }
  };

  const getTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [
      ...visits.map((visit) => ({
        ...visit,
        eventType: "visit" as const,
      })),
      ...vaccinations.map((vaccination) => ({
        ...vaccination,
        eventType: "vaccination" as const,
      })),
    ];

    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  const getEventTypeColor = (eventType: string) => {
    return eventType === "vaccination" ? "#10b981" : "#3b82f6";
  };

  const getVisitTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      routine: "Rutina",
      emergency: "Emergencia",
      "follow-up": "Seguimiento",
      consultation: "Consulta",
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando historial médico...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTimelineData}>
          <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timelineEvents = getTimelineEvents();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Línea de Tiempo Médica</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timeline}>
          {timelineEvents.length > 0 ? (
            timelineEvents.map((event, index) => (
              <View
                key={`${event.eventType}-${event.id}`}
                style={styles.timelineItem}
              >
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: getEventTypeColor(event.eventType) },
                    ]}
                  />
                  {index < timelineEvents.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.shortDate}>
                      {formatShortDate(event.date)}
                    </Text>
                  </View>

                  <View style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>
                        {event.eventType === "vaccination"
                          ? (event as Vaccination).vaccine
                          : (event as Visit).diagnosis}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor:
                              event.eventType === "vaccination"
                                ? "#dcfce7"
                                : "#dbeafe",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            {
                              color:
                                event.eventType === "vaccination"
                                  ? "#166534"
                                  : "#1e40af",
                            },
                          ]}
                        >
                          {event.eventType === "vaccination"
                            ? "Vacunación"
                            : getVisitTypeLabel((event as Visit).type)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.eventDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Veterinario:</Text>
                        <Text style={styles.detailValue}>
                          {event.veterinarian}
                        </Text>
                      </View>

                      {event.eventType === "visit" && (
                        <>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Tratamiento:</Text>
                            <Text style={styles.detailValue}>
                              {(event as Visit).treatment}
                            </Text>
                          </View>

                          {(event as Visit).notes && (
                            <View style={styles.notesContainer}>
                              <Text style={styles.notesLabel}>Notas:</Text>
                              <Text style={styles.notesText}>
                                {(event as Visit).notes}
                              </Text>
                            </View>
                          )}

                          <View style={styles.costContainer}>
                            <Text style={styles.costLabel}>
                              Costo del servicio
                            </Text>
                            <Text style={styles.costValue}>
                              ₡{Number((event as Visit).cost).toFixed(2)}
                            </Text>
                          </View>
                        </>
                      )}

                      {event.eventType === "vaccination" && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Dosis:</Text>
                          <Text style={styles.detailValue}>
                            {(event as Vaccination).dosis}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay eventos registrados</Text>
              <Text style={styles.emptySubtext}>
                El historial médico aparecerá aquí cuando se registren visitas o
                vacunaciones
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  scrollView: {
    flex: 1,
  },
  timeline: {
    padding: 20,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 15,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e2e8f0",
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
  },
  dateContainer: {
    marginBottom: 8,
  },
  shortDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  eventCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  eventDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    minWidth: 90,
  },
  detailValue: {
    fontSize: 14,
    color: "#1e293b",
    flex: 1,
  },
  notesContainer: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  costContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  costLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  costValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PatientTimeline;
