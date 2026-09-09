"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

interface FeaturedContentManagerProps {
  onClose: () => void;
  onSaved?: () => void;
}

export default function FeaturedContentManager({
  onClose,
  onSaved,
}: FeaturedContentManagerProps) {
  const [featured, setFeatured] =
    useState<FeaturedContent | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFeatured();
  }, []);

  // =========================
  // CARGAR OFERTA
  // =========================

  const loadFeatured = async () => {
    setLoading(true);
    setMessage("");

    const {
      data,
      error,
    } = await supabase
      .from("featured_content")
      .select("*")
      .order("id", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      setMessage(
        `No pudimos cargar la oferta: ${error.message}`
      );
      setLoading(false);
      return;
    }

    if (!data) {
      setMessage(
        "No existe una oferta configurada todavía."
      );
      setLoading(false);
      return;
    }

    setFeatured(data);
    setLoading(false);
  };

  // =========================
  // CAMBIAR CAMPO
  // =========================

  const updateField = (
    field: keyof FeaturedContent,
    value: string | number | boolean | null
  ) => {
    setFeatured((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  };

  // =========================
  // OBTENER PATH IMAGEN
  // =========================

  const getStoragePath = (
    imageUrl: string | null
  ) => {
    if (!imageUrl) return null;

    const marker =
      "/storage/v1/object/public/product-images/";

    const index = imageUrl.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      imageUrl.substring(
        index + marker.length
      )
    );
  };

  // =========================
  // SUBIR IMAGEN
  // =========================

  const handleImageChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file || !featured) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Selecciona una imagen válida."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "La imagen no puede superar los 5 MB."
      );
      event.target.value = "";
      return;
    }

    setUploading(true);
    setMessage("");

    const extension =
      file.name.split(".").pop() || "jpg";

    const fileName =
      `featured-${featured.id}-${Date.now()}.${extension}`;

    const filePath =
      `featured/${fileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);

      setMessage(
        `No pudimos subir la imagen: ${uploadError.message}`
      );

      setUploading(false);
      event.target.value = "";
      return;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    const newImageUrl =
      publicUrlData.publicUrl;

    const {
      error: updateError,
    } = await supabase
      .from("featured_content")
      .update({
        image_url: newImageUrl,
      })
      .eq("id", featured.id);

    if (updateError) {
      console.error(updateError);

      await supabase.storage
        .from("product-images")
        .remove([filePath]);

      setMessage(
        `No pudimos guardar la imagen: ${updateError.message}`
      );

      setUploading(false);
      event.target.value = "";
      return;
    }

    const oldPath = getStoragePath(
      featured.image_url
    );

    if (oldPath) {
      await supabase.storage
        .from("product-images")
        .remove([oldPath]);
    }

    setFeatured((current) =>
      current
        ? {
            ...current,
            image_url: newImageUrl,
          }
        : current
    );

    setMessage(
      "Imagen actualizada correctamente."
    );

    setUploading(false);
    event.target.value = "";

    window.setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  // =========================
  // GUARDAR
  // =========================

  const saveFeatured = async () => {
    if (!featured) return;

    if (!featured.title.trim()) {
      setMessage(
        "El título es obligatorio."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      error,
    } = await supabase
      .from("featured_content")
      .update({
        title: featured.title.trim(),
        subtitle:
          featured.subtitle?.trim() || null,
        description:
          featured.description?.trim() || null,
        price:
          featured.price === null
            ? null
            : Number(featured.price),
        button_text:
          featured.button_text?.trim() || null,
        button_url:
          featured.button_url?.trim() || null,
        active: featured.active,
      })
      .eq("id", featured.id);

    if (error) {
      console.error(error);

      setMessage(
        `No pudimos guardar la oferta: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setMessage(
      featured.active
        ? "Oferta guardada y activa."
        : "Oferta guardada como inactiva."
    );

    setSaving(false);

    if (onSaved) {
      onSaved();
    }

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <section className="featured-admin-panel">
        <p>Cargando oferta...</p>
      </section>
    );
  }

  if (!featured) {
    return (
      <section className="featured-admin-panel">
        <div className="featured-admin-header">
          <div>
            <span>
              IL TRAMONTO · DESTACADO
            </span>

            <h2>
              Oferta del mes
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="featured-admin-close"
          >
            ×
          </button>
        </div>

        <div className="featured-admin-message">
          {message ||
            "No hay una oferta configurada."}
        </div>
      </section>
    );
  }

  // =========================
  // RENDER
  // =========================

  return (
    <section className="featured-admin-panel">

      <div className="featured-admin-header">

        <div>
          <span>
            IL TRAMONTO · DESTACADO
          </span>

          <h2>
            ⭐ Oferta del mes
          </h2>

          <p>
            Esta información aparece en la ventana
            destacada del inicio.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="featured-admin-close"
          aria-label="Cerrar"
        >
          ×
        </button>

      </div>

      {message && (
        <div className="featured-admin-message">
          {message}
        </div>
      )}

      <div className="featured-admin-grid">

        {/* FOTO */}

        <div className="featured-admin-image">

          {featured.image_url ? (
            <img
              src={featured.image_url}
              alt={featured.title}
            />
          ) : (
            <div className="featured-admin-image-empty">
              SIN FOTO
            </div>
          )}

          <label className="featured-admin-upload">

            {uploading
              ? "SUBIENDO..."
              : featured.image_url
              ? "CAMBIAR FOTO"
              : "SUBIR FOTO"}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploading || saving}
              hidden
            />

          </label>

          <small>
            Máximo 5 MB.
          </small>

        </div>

        {/* CAMPOS */}

        <div className="featured-admin-fields">

          <div className="featured-admin-field">

            <label htmlFor="featured-title">
              TÍTULO
            </label>

            <input
              id="featured-title"
              type="text"
              value={featured.title}
              onChange={(event) =>
                updateField(
                  "title",
                  event.target.value
                )
              }
              placeholder="Vino del mes"
            />

          </div>

          <div className="featured-admin-field">

            <label htmlFor="featured-subtitle">
              SUBTÍTULO
            </label>

            <input
              id="featured-subtitle"
              type="text"
              value={featured.subtitle ?? ""}
              onChange={(event) =>
                updateField(
                  "subtitle",
                  event.target.value
                )
              }
              placeholder="UNA SELECCIÓN ESPECIAL"
            />

          </div>

          <div className="featured-admin-field">

            <label htmlFor="featured-description">
              DESCRIPCIÓN
            </label>

            <textarea
              id="featured-description"
              value={featured.description ?? ""}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              rows={4}
              placeholder="Describe la oferta..."
            />

          </div>

          <div className="featured-admin-two-columns">

            <div className="featured-admin-field">

              <label htmlFor="featured-price">
                PRECIO
              </label>

              <input
                id="featured-price"
                type="number"
                value={
                  featured.price ?? ""
                }
                onChange={(event) =>
                  updateField(
                    "price",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value)
                  )
                }
                placeholder="42900"
              />

            </div>

            <div className="featured-admin-field">

              <label htmlFor="featured-button-text">
                TEXTO DEL BOTÓN
              </label>

              <input
                id="featured-button-text"
                type="text"
                value={
                  featured.button_text ?? ""
                }
                onChange={(event) =>
                  updateField(
                    "button_text",
                    event.target.value
                  )
                }
                placeholder="DESCUBRIR"
              />

            </div>

          </div>

          <div className="featured-admin-field">

            <label htmlFor="featured-button-url">
              ENLACE DEL BOTÓN
            </label>

            <input
              id="featured-button-url"
              type="text"
              value={
                featured.button_url ?? ""
              }
              onChange={(event) =>
                updateField(
                  "button_url",
                  event.target.value
                )
              }
              placeholder="/menu"
            />

            <small>
              Ejemplo: /menu/bebidas
            </small>

          </div>

          <label className="featured-admin-active">

            <input
              type="checkbox"
              checked={featured.active}
              onChange={(event) =>
                updateField(
                  "active",
                  event.target.checked
                )
              }
            />

            <span>
              OFERTA ACTIVA
            </span>

          </label>

        </div>

      </div>

      <div className="featured-admin-actions">

        <button
          type="button"
          onClick={onClose}
          className="featured-admin-cancel"
          disabled={saving}
        >
          CERRAR
        </button>

        <button
          type="button"
          onClick={saveFeatured}
          className="featured-admin-save"
          disabled={saving || uploading}
        >
          {saving
            ? "GUARDANDO..."
            : "GUARDAR OFERTA"}
        </button>

      </div>

    </section>
  );
}