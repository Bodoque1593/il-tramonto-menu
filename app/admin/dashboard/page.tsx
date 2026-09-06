"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/admin";
        return;
      }

      setEmail(user.email ?? "");
      setLoading(false);
    };

    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  if (loading) {
    return (
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-loading">
          Cargando...
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">

      {/* HEADER */}

      <header className="admin-dashboard-header">

        <div>
          <span className="admin-dashboard-eyebrow">
            IL TRAMONTO · MIRADOR OCULTO
          </span>

          <h1>
            Administración
          </h1>

          <p>
            Panel de gestión
          </p>
        </div>

        <div className="admin-dashboard-account">

          <span>
            {email}
          </span>

          <button
            type="button"
            onClick={handleLogout}
          >
            CERRAR SESIÓN
          </button>

        </div>

      </header>


      {/* OPCIONES */}

      <section className="admin-dashboard-content">

        <div className="admin-dashboard-intro">

          <span>
            BENVENUTO
          </span>

          <h2>
            ¿Qué quieres gestionar?
          </h2>

          <p>
            Selecciona una sección para continuar.
          </p>

        </div>


        <div className="admin-dashboard-grid">

          {/* RESERVAS */}

          <Link
            href="/admin/reservas"
            className="admin-dashboard-card"
          >

            <div className="admin-dashboard-card-number">
              01
            </div>

            <div className="admin-dashboard-card-content">

              <span>
                RESERVAS
              </span>

              <h3>
                Gestionar reservas
              </h3>

              <p>
                Consulta las solicitudes,
                confirma reservas y cancela
                las que sean necesarias.
              </p>

            </div>

            <div className="admin-dashboard-card-arrow">
              →
            </div>

          </Link>


          {/* PRODUCTOS */}

          <Link
            href="/admin/products"
            className="admin-dashboard-card"
          >

            <div className="admin-dashboard-card-number">
              02
            </div>

            <div className="admin-dashboard-card-content">

              <span>
                CARTA
              </span>

              <h3>
                Gestionar productos
              </h3>

              <p>
                Actualiza precios,
                descripciones, fotografías
                y disponibilidad.
              </p>

            </div>

            <div className="admin-dashboard-card-arrow">
              →
            </div>

          </Link>

        </div>


        {/* VOLVER AL SITIO */}

        <div className="admin-dashboard-back">

          <Link href="/">
            ← VOLVER AL SITIO WEB
          </Link>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="admin-dashboard-footer">

        <span>
          IL TRAMONTO · MIRADOR OCULTO
        </span>

        <span>
          AREA RISERVATA
        </span>

      </footer>

    </main>
  );
}