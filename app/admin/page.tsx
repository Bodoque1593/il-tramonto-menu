"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";


export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin/dashboard";
  };

  return (
    <main className="admin-login-page">

      <div className="admin-login-card">

        <span className="admin-login-brand">
          IL TRAMONTO
        </span>

        <h1>
          Administración
        </h1>

        <p className="admin-login-location">
          Mirador Oculto · Anapoima
        </p>

        <form
          className="admin-login-form"
          onSubmit={handleLogin}
        >

          <div className="admin-login-field">

            <label htmlFor="email">
              CORREO
            </label>

            <input
              id="email"
              type="email"
              placeholder="correo@iltramonto.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </div>


          <div className="admin-login-field">

            <label htmlFor="password">
              CONTRASEÑA
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>


          {error && (
            <p className="admin-login-error">
              {error}
            </p>
          )}


          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading
              ? "INGRESANDO..."
              : "INGRESAR →"}
          </button>

        </form>

      </div>

    </main>
  );
}