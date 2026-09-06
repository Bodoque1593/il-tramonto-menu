"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Category {
  id: number;
  name: string;
}

interface NewProductFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

function createSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewProductForm({
  onCreated,
  onCancel,
}: NewProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    category_id: "",
    name: "",
    description: "",
    price: "",
    position: "0",
    available: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);

    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("position", { ascending: true });

    if (error) {
      console.error("ERROR CATEGORÍAS:", error);
      setError(
        `No pudimos cargar las categorías: ${error.message}`
      );
    } else {
      setCategories(data ?? []);

      if (data && data.length > 0) {
        setForm((current) => ({
          ...current,
          category_id: String(data[0].id),
        }));
      }
    }

    setLoadingCategories(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    if (!form.category_id) {
      setError("Selecciona una categoría.");
      setSaving(false);
      return;
    }

    if (!form.name.trim()) {
      setError("Escribe el nombre del producto.");
      setSaving(false);
      return;
    }

    const price = Number(
      form.price.replace(/\D/g, "")
    );

    if (!price || price <= 0) {
      setError("Escribe un precio válido.");
      setSaving(false);
      return;
    }

    const slug = createSlug(form.name);

    if (!slug) {
      setError("No pudimos generar el identificador del producto.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("products")
      .insert({
        category_id: Number(form.category_id),
        name: form.name.trim(),
        slug,
        description: form.description.trim() || null,
        price,
        position: Number(form.position) || 0,
        available: form.available,
        image_url: null,
      });

    if (error) {
      console.error("ERROR CREANDO PRODUCTO:", error);

      setError(
        `No pudimos crear el producto: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setSaving(false);

    onCreated();
  };

  return (
    <div className="new-product-overlay">

      <div className="new-product-modal">

        <button
          type="button"
          className="new-product-close"
          onClick={onCancel}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="new-product-heading">

          <span>
            IL TRAMONTO · CARTA
          </span>

          <h2>
            Nuevo producto
          </h2>

          <p>
            Agrega un nuevo plato a la carta.
          </p>

        </div>

        <form
          className="new-product-form"
          onSubmit={handleSubmit}
        >

          <div className="new-product-field">

            <label htmlFor="new-category">
              CATEGORÍA
            </label>

            <select
              id="new-category"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              disabled={loadingCategories}
              required
            >
              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

          </div>

          <div className="new-product-field">

            <label htmlFor="new-name">
              NOMBRE
            </label>

            <input
              id="new-name"
              name="name"
              type="text"
              placeholder="Ej. Lasagna de carne"
              value={form.name}
              onChange={handleChange}
              required
            />

            <small>
              El enlace del producto se generará automáticamente.
            </small>

          </div>

          <div className="new-product-grid">

            <div className="new-product-field">

              <label htmlFor="new-price">
                PRECIO
              </label>

              <input
                id="new-price"
                name="price"
                type="text"
                inputMode="numeric"
                placeholder="34900"
                value={form.price}
                onChange={handleChange}
                required
              />

              <small>
                Escribe solo números. Ej: 34900
              </small>

            </div>

            <div className="new-product-field">

              <label htmlFor="new-position">
                POSICIÓN
              </label>

              <input
                id="new-position"
                name="position"
                type="number"
                min="0"
                value={form.position}
                onChange={handleChange}
              />

              <small>
                Orden dentro de la categoría.
              </small>

            </div>

          </div>

          <div className="new-product-field">

            <label htmlFor="new-description">
              DESCRIPCIÓN
            </label>

            <textarea
              id="new-description"
              name="description"
              placeholder="Describe el plato..."
              value={form.description}
              onChange={handleChange}
              rows={4}
            />

          </div>

          <label className="new-product-availability">

            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  available: e.target.checked,
                }))
              }
            />

            <span>
              Producto disponible
            </span>

          </label>

          {error && (
            <p className="new-product-error">
              {error}
            </p>
          )}

          <div className="new-product-actions">

            <button
              type="button"
              className="new-product-cancel"
              onClick={onCancel}
              disabled={saving}
            >
              CANCELAR
            </button>

            <button
              type="submit"
              className="new-product-submit"
              disabled={saving || loadingCategories}
            >
              {saving
                ? "CREANDO..."
                : "CREAR PRODUCTO →"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}