"use client";

import { useEffect, useState } from "react";


interface FeaturedContent {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  button_text: string | null;
  button_url: string | null;
  active: boolean;
}

interface MonthlyFeatureProps {
  featured: FeaturedContent | null;
}

export default function MonthlyFeature({
  featured,
}: MonthlyFeatureProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!featured) return;

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [featured]);

  if (!featured || !visible) {
    return null;
  }

  return (
    <div className="monthly-feature-overlay">
      <div className="monthly-feature">

        {/* CERRAR */}

        <button
          type="button"
          className="monthly-close"
          onClick={() => setVisible(false)}
          aria-label="Cerrar"
        >
          ×
        </button>

        {/* IMAGEN */}

        <div className="monthly-image">
          {featured.image_url ? (
            <img
              src={featured.image_url}
              alt={featured.title}
            />
          ) : (
            <div className="monthly-placeholder">
              <span>IL TRAMONTO</span>

              <small>
                FOTO DEL MES
              </small>
            </div>
          )}
        </div>

        {/* INFORMACIÓN */}

        <div className="monthly-content">

          {featured.subtitle && (
            <span className="monthly-eyebrow">
              {featured.subtitle}
            </span>
          )}

          <h2>
            {featured.title}
          </h2>

          {featured.description && (
            <p>
              {featured.description}
            </p>
          )}

          {featured.price !== null && (
            <div className="monthly-price">
              $
              {featured.price.toLocaleString("es-CO")}
            </div>
          )}
          <div className="monthly-question">
  ¿Te antoja? Pregunta al mesero.
</div>

        

        </div>

      </div>
    </div>
  );
}