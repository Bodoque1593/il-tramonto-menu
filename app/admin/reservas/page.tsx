"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Reservation {
  id: number;
  customer_name: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  notes: string | null;
  status: string;
  created_at: string;
}

type ActionType = "confirm" | "cancel" | null;
type DateFilter = "today" | "tomorrow" | "all";

export default function ReservationsAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("today");

  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  const [actionType, setActionType] =
    useState<ActionType>(null);

  const [processing, setProcessing] = useState(false);

  // =====================================================
  // FECHA LOCAL
  // =====================================================

  const getLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = getLocalDate(new Date());

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const tomorrow = getLocalDate(tomorrowDate);

  // =====================================================
  // CARGAR RESERVAS
  // =====================================================

  const loadReservations = async (
    showRefresh = false
  ) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/admin";
      return;
    }

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("reservation_date", {
        ascending: true,
      })
      .order("reservation_time", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error cargando reservas:",
        error
      );
    }

    if (data) {
      setReservations(data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadReservations();
  }, []);

  // =====================================================
  // ABRIR MODAL
  // =====================================================

  const openConfirmation = (
    reservation: Reservation,
    action: ActionType
  ) => {
    setSelectedReservation(reservation);
    setActionType(action);
  };

  // =====================================================
  // CERRAR MODAL
  // =====================================================

  const closeConfirmation = () => {
    if (processing) return;

    setSelectedReservation(null);
    setActionType(null);
  };

  // =====================================================
  // ACTUALIZAR ESTADO
  // =====================================================

  const updateReservationStatus = async () => {
    if (!selectedReservation || !actionType) {
      return;
    }

    setProcessing(true);

    const newStatus =
      actionType === "confirm"
        ? "confirmed"
        : "cancelled";

    const { error } = await supabase
      .from("reservations")
      .update({
        status: newStatus,
      })
      .eq("id", selectedReservation.id);

    if (error) {
      console.error(
        "Error actualizando reserva:",
        error
      );

      alert(
        "No se pudo actualizar la reserva. Intenta nuevamente."
      );

      setProcessing(false);
      return;
    }

    setReservations((prev) =>
      prev.map((reservation) =>
        reservation.id === selectedReservation.id
          ? {
              ...reservation,
              status: newStatus,
            }
          : reservation
      )
    );

    setProcessing(false);
    setSelectedReservation(null);
    setActionType(null);
  };

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  // =====================================================
  // FORMATO FECHA
  // =====================================================

  const formatDate = (dateString: string) => {
    const date = new Date(
      `${dateString}T12:00:00`
    );

    return date.toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "long",
    });
  };

  // =====================================================
  // WHATSAPP
  // =====================================================

  const getWhatsAppUrl = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, "");

    // Si escribieron un número colombiano de 10 dígitos
    if (cleanPhone.length === 10) {
      cleanPhone = `57${cleanPhone}`;
    }

    const message = encodeURIComponent(
      "Hola, soy de Il Tramonto · Mirador Oculto. " +
      "Te escribimos acerca de tu solicitud de reserva."
    );

    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  // =====================================================
  // FILTRAR POR FECHA
  // =====================================================

  const filteredReservations =
    reservations.filter((reservation) => {
      if (dateFilter === "all") {
        return true;
      }

      if (dateFilter === "today") {
        return reservation.reservation_date === today;
      }

      if (dateFilter === "tomorrow") {
        return reservation.reservation_date === tomorrow;
      }

      return true;
    });

  // =====================================================
  // CONTADORES
  // =====================================================

  const pendingCount = filteredReservations.filter(
    (reservation) =>
      reservation.status === "pending"
  ).length;

  const confirmedCount = filteredReservations.filter(
    (reservation) =>
      reservation.status === "confirmed"
  ).length;

  const cancelledCount = filteredReservations.filter(
    (reservation) =>
      reservation.status === "cancelled"
  ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="admin-page">

        <div className="admin-loading">
          <span>IL TRAMONTO</span>
          <h1>Cargando reservas...</h1>
        </div>

      </main>
    );
  }

  // =====================================================
  // PANEL
  // =====================================================

  return (
    <main className="admin-page">

      {/* ================= HEADER ================= */}

      <header className="admin-header">

        <div className="admin-header-brand">

          <span>
            IL TRAMONTO · MIRADOR OCULTO
          </span>

          <h1>
            Reservas
          </h1>

          <p>
            Gestión de reservas
          </p>

        </div>


        <div className="admin-header-actions">

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => loadReservations(true)}
            disabled={refreshing}
          >
            {refreshing
              ? "ACTUALIZANDO..."
              : "↻ ACTUALIZAR"}
          </button>

          <button
            type="button"
            className="admin-logout-button"
            onClick={logout}
          >
            CERRAR SESIÓN
          </button>

        </div>

      </header>


      {/* ================= FILTROS ================= */}

      <section className="admin-toolbar">

        <div className="reservation-filters">

          <button
            type="button"
            className={
              dateFilter === "today"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() =>
              setDateFilter("today")
            }
          >
            HOY
          </button>

          <button
            type="button"
            className={
              dateFilter === "tomorrow"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() =>
              setDateFilter("tomorrow")
            }
          >
            MAÑANA
          </button>

          <button
            type="button"
            className={
              dateFilter === "all"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() =>
              setDateFilter("all")
            }
          >
            TODAS
          </button>

        </div>


        <div className="reservation-stats">

          <span>
            <strong>{pendingCount}</strong>
            PENDIENTES
          </span>

          <span>
            <strong>{confirmedCount}</strong>
            CONFIRMADAS
          </span>

          <span>
            <strong>{cancelledCount}</strong>
            CANCELADAS
          </span>

        </div>

      </section>


      {/* ================= LISTA ================= */}

      <section className="reservations-list">

        {filteredReservations.length === 0 ? (

          <div className="reservation-empty">

            <span>
              NESSUNA PRENOTAZIONE
            </span>

            <h2>
              No hay reservas para este día.
            </h2>

            <p>
              Las nuevas solicitudes aparecerán
              automáticamente aquí.
            </p>

          </div>

        ) : (

          filteredReservations.map(
            (reservation) => (

              <article
                key={reservation.id}
                className={`reservation-card ${reservation.status}`}
              >

                {/* HORA */}

                <div className="reservation-card-time">

                  <strong>
                    {reservation.reservation_time.slice(
                      0,
                      5
                    )}
                  </strong>

                  <span>
                    {formatDate(
                      reservation.reservation_date
                    )}
                  </span>

                </div>


                {/* INFORMACIÓN */}

                <div className="reservation-card-info">

                  <h2>
                    {reservation.customer_name}
                  </h2>

                  <p className="reservation-guests">
                    {reservation.guests}{" "}
                    {reservation.guests === 1
                      ? "persona"
                      : "personas"}
                  </p>

                  <p>
                    WhatsApp:{" "}
                    {reservation.phone}
                  </p>

                  {reservation.notes && (
                    <p className="reservation-notes">
                      {reservation.notes}
                    </p>
                  )}

                  <a
                    href={getWhatsAppUrl(
                      reservation.phone
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reservation-whatsapp"
                  >
                    ABRIR WHATSAPP →
                  </a>

                </div>


                {/* ESTADO Y ACCIONES */}

                <div className="reservation-card-actions">

                  <span
                    className={`reservation-status ${reservation.status}`}
                  >

                    {reservation.status ===
                      "pending" &&
                      "PENDIENTE"}

                    {reservation.status ===
                      "confirmed" &&
                      "CONFIRMADA"}

                    {reservation.status ===
                      "cancelled" &&
                      "CANCELADA"}

                  </span>


                  {/* PENDIENTE */}

                  {reservation.status ===
                    "pending" && (

                    <div className="reservation-actions">

                      <button
                        type="button"
                        className="reservation-confirm"
                        onClick={() =>
                          openConfirmation(
                            reservation,
                            "confirm"
                          )
                        }
                      >
                        CONFIRMAR
                      </button>

                      <button
                        type="button"
                        className="reservation-cancel"
                        onClick={() =>
                          openConfirmation(
                            reservation,
                            "cancel"
                          )
                        }
                      >
                        CANCELAR
                      </button>

                    </div>

                  )}


                  {/* CONFIRMADA */}

                  {reservation.status ===
                    "confirmed" && (

                    <div className="reservation-actions">

                      <button
                        type="button"
                        className="reservation-cancel"
                        onClick={() =>
                          openConfirmation(
                            reservation,
                            "cancel"
                          )
                        }
                      >
                        CANCELAR RESERVA
                      </button>

                    </div>

                  )}

                </div>

              </article>

            )
          )

        )}

      </section>


      {/* =================================================
          MODAL DE CONFIRMACIÓN
      ================================================= */}

      {selectedReservation &&
        actionType && (

          <div
            className="reservation-modal-overlay"
            onClick={closeConfirmation}
          >

            <div
              className="reservation-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <span className="reservation-modal-eyebrow">
                IL TRAMONTO
              </span>

              <h2>

                {actionType === "confirm"
                  ? "¿Confirmar reserva?"
                  : "¿Cancelar reserva?"}

              </h2>


              <div className="reservation-modal-details">

                <strong>
                  {selectedReservation.customer_name}
                </strong>

                <span>
                  {selectedReservation.guests}{" "}
                  {selectedReservation.guests === 1
                    ? "persona"
                    : "personas"}
                </span>

                <span>
                  {formatDate(
                    selectedReservation.reservation_date
                  )}
                  {" · "}
                  {selectedReservation.reservation_time.slice(
                    0,
                    5
                  )}
                </span>

              </div>


              <p className="reservation-modal-message">

                {actionType === "confirm"
                  ? "Esta acción cambiará el estado de la reserva a confirmada."
                  : "Esta reserva quedará marcada como cancelada y permanecerá en el historial."}

              </p>


              <div className="reservation-modal-actions">

                <button
                  type="button"
                  className="modal-back-button"
                  onClick={closeConfirmation}
                  disabled={processing}
                >
                  VOLVER
                </button>

                <button
                  type="button"
                  className={
                    actionType === "confirm"
                      ? "modal-confirm-button"
                      : "modal-cancel-button"
                  }
                  onClick={
                    updateReservationStatus
                  }
                  disabled={processing}
                >

                  {processing
                    ? "PROCESANDO..."
                    : actionType === "confirm"
                      ? "CONFIRMAR RESERVA →"
                      : "CANCELAR RESERVA"}

                </button>

              </div>

            </div>

          </div>

        )}

    </main>
  );
}