"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


interface Category {
  id: number;
  name: string;
  slug: string;
  position: number;
  active: boolean;
}

interface CategoryManagerProps {
  onChanged: () => void;
}

function createSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoryManager({
  onChanged,
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("0");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, position, active")
      .order("position", { ascending: true });

    if (error) {
      console.error(error);
      setError(`No pudimos cargar las categorías: ${error.message}`);
    } else {
      setCategories(data ?? []);
    }

    setLoading(false);
  };

  const handleCreate = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Escribe el nombre de la categoría.");
      setSaving(false);
      return;
    }

    const slug = createSlug(name);

    if (!slug) {
      setError("No pudimos generar el slug de la categoría.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("categories")
      .insert({
        name: name.trim(),
        slug,
        position: Number(position) || 0,
        active: true,
      });

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        setError(
          "Ya existe una categoría con ese nombre o slug."
        );
      } else {
        setError(
          `No pudimos crear la categoría: ${error.message}`
        );
      }

      setSaving(false);
      return;
    }

    setName("");
    setPosition("0");
    setShowForm(false);
    setSaving(false);

    setMessage("Categoría creada correctamente.");

    await loadCategories();
    onChanged();

    window.setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  const handleDelete = async (
    category: Category
  ) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar la categoría "${category.name}"?\n\nLa categoría solo podrá eliminarse si no tiene productos asociados.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(category.id);
    setError("");
    setMessage("");

    // Verificar si existen productos
    const { count, error: countError } =
      await supabase
        .from("products")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("category_id", category.id);

    if (countError) {
      console.error(countError);

      setError(
        `No pudimos comprobar los productos de esta categoría: ${countError.message}`
      );

      setDeletingId(null);
      return;
    }

    if ((count ?? 0) > 0) {
      setError(
        `No se puede eliminar "${category.name}" porque tiene ${count} producto${
          count === 1 ? "" : "s"
        } asociado${count === 1 ? "" : "s"}.`
      );

      setDeletingId(null);
      return;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      console.error(error);

      setError(
        `No pudimos eliminar la categoría: ${error.message}`
      );

      setDeletingId(null);
      return;
    }

    setCategories((current) =>
      current.filter(
        (item) => item.id !== category.id
      )
    );

    setMessage("Categoría eliminada correctamente.");

    setDeletingId(null);

    onChanged();

    window.setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  return (
    <section className="category-manager">

      <div className="category-manager-header">

        <div>
          <span className="category-manager-eyebrow">
            ORGANIZACIÓN DE LA CARTA
          </span>

          <h2>
            Categorías
          </h2>

          <p>
            Crea o elimina las secciones de la carta.
          </p>
        </div>

        <button
          type="button"
          className="category-manager-new"
          onClick={() => {
            setShowForm((current) => !current);
            setError("");
            setMessage("");
          }}
        >
          {showForm
            ? "CERRAR"
            : "+ NUEVA CATEGORÍA"}
        </button>

      </div>

      {showForm && (
        <form
          className="category-manager-form"
          onSubmit={handleCreate}
        >

          <div className="new-product-field">

            <label htmlFor="category-name">
              NOMBRE
            </label>

            <input
              id="category-name"
              type="text"
              placeholder="Ej. Pizzas"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              disabled={saving}
              required
            />

            <small>
              El enlace se generará automáticamente.
            </small>

          </div>

          <div className="new-product-field">

            <label htmlFor="category-position">
              POSICIÓN
            </label>

            <input
              id="category-position"
              type="number"
              min="0"
              value={position}
              onChange={(e) =>
                setPosition(e.target.value)
              }
              disabled={saving}
            />

            <small>
              Orden en la carta.
            </small>

          </div>

          <button
            type="submit"
            className="new-product-submit"
            disabled={saving}
          >
            {saving
              ? "CREANDO..."
              : "CREAR CATEGORÍA →"}
          </button>

        </form>
      )}

      {message && (
        <div className="category-manager-message">
          {message}
        </div>
      )}

      {error && (
        <div className="category-manager-error">
          {error}
        </div>
      )}

      <div className="category-manager-list">

        {loading ? (
          <p>Cargando categorías...</p>
        ) : categories.length === 0 ? (
          <p>No hay categorías.</p>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="category-manager-item"
            >

              <div>
                <strong>
                  {category.name}
                </strong>

                <span>
                  /{category.slug} · posición{" "}
                  {category.position}
                </span>
              </div>

              <button
                type="button"
                className="category-manager-delete"
                onClick={() =>
                  handleDelete(category)
                }
                disabled={
                  deletingId === category.id
                }
              >
                {deletingId === category.id
                  ? "ELIMINANDO..."
                  : "🗑 ELIMINAR"}
              </button>

            </div>
          ))
        )}

      </div>

    </section>
  );
}