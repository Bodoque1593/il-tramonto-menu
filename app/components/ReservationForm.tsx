"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReservationForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    reservation_date: "",
    reservation_time: "",
    guests: "2",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess(false);

    const { error } = await supabase
      .from("reservations")
      .insert({
        customer_name: form.customer_name,
        phone: form.phone,
        reservation_date: form.reservation_date,
        reservation_time: form.reservation_time,
        guests: Number(form.guests),
        notes: form.notes || null,
        status: "pending",
      });

if (error) {
  console.error("ERROR RESERVA:", error);

  setError(
    `Error: ${error.message}`
  );

  setLoading(false);
  return;
}

    setSuccess(true);

    setForm({
      customer_name: "",
      phone: "",
      reservation_date: "",
      reservation_time: "",
      guests: "2",
      notes: "",
    });

    setLoading(false);
  };

  if (success) {
    return (
      <div className="reservation-success">

        <span className="reservation-success-mark">
          ✓
        </span>

        <span className="reservation-eyebrow">
          RICHIESTA INVIATA
        </span>

        <h3>
          Solicitud recibida
        </h3>

        <p>
          Hemos recibido tu solicitud de reserva.
          <br />
          Nuestro equipo la revisará y te confirmará
          por WhatsApp.
        </p>

        <button
          type="button"
          className="reservation-secondary-button"
          onClick={() => setSuccess(false)}
        >
          HACER OTRA RESERVA
        </button>

      </div>
    );
  }

  return (
    <div className="reservation-form-wrapper">

      <div className="reservation-heading">

        <span className="reservation-eyebrow">
          PRENOTAZIONE
        </span>

        <h3>
          Reserva tu mesa
        </h3>

        <p>
          Déjanos tus datos y te confirmaremos
          la disponibilidad por WhatsApp.
        </p>

      </div>


      <form
        className="reservation-form"
        onSubmit={handleSubmit}
      >

        <div className="reservation-field">

          <label htmlFor="customer_name">
            NOMBRE
          </label>

          <input
            id="customer_name"
            name="customer_name"
            type="text"
            placeholder="Tu nombre"
            value={form.customer_name}
            onChange={handleChange}
            required
          />

        </div>


        <div className="reservation-field">

          <label htmlFor="phone">
            WHATSAPP
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="300 000 0000"
            value={form.phone}
            onChange={handleChange}
            required
          />

        </div>


        <div className="reservation-grid">

          <div className="reservation-field">

            <label htmlFor="reservation_date">
              FECHA
            </label>

            <input
              id="reservation_date"
              name="reservation_date"
              type="date"
              value={form.reservation_date}
              onChange={handleChange}
              required
            />

          </div>


          <div className="reservation-field">

            <label htmlFor="reservation_time">
              HORA
            </label>

            <input
              id="reservation_time"
              name="reservation_time"
              type="time"
              value={form.reservation_time}
              onChange={handleChange}
              required
            />

          </div>

        </div>


        <div className="reservation-field">

          <label htmlFor="guests">
            PERSONAS
          </label>

          <select
            id="guests"
            name="guests"
            value={form.guests}
            onChange={handleChange}
          >
            <option value="1">1 persona</option>
            <option value="2">2 personas</option>
            <option value="3">3 personas</option>
            <option value="4">4 personas</option>
            <option value="5">5 personas</option>
            <option value="6">6 personas</option>
            <option value="7">7 personas</option>
            <option value="8">8 personas</option>
            <option value="9">9 personas</option>
            <option value="10">10 personas</option>
          </select>

        </div>


        <div className="reservation-field">

          <label htmlFor="notes">
            COMENTARIO
            <span> OPCIONAL</span>
          </label>

          <textarea
            id="notes"
            name="notes"
            placeholder="Cumpleaños, ocasión especial..."
            value={form.notes}
            onChange={handleChange}
            rows={3}
          />

        </div>


        {error && (
          <p className="reservation-error">
            {error}
          </p>
        )}


        <button
          type="submit"
          className="reservation-submit"
          disabled={loading}
        >
          {loading
            ? "ENVIANDO..."
            : "SOLICITAR RESERVA →"}
        </button>


        <small className="reservation-note">
          La reserva queda sujeta a confirmación
          por parte de nuestro equipo.
        </small>

      </form>

    </div>
  );
}