"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import NewProductForm from "./NewProductForm";
import CategoryManager from "./CategoryManager";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  position: number;
  category_id: number;
  recommended: boolean;
  is_new: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface ProductWithCategory extends Product {
  categoryName: string;
}

function createSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  // =========================
  // CARGAR PRODUCTOS
  // =========================

  const loadProducts = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/admin";
      return;
    }

    // =========================
    // CATEGORÍAS
    // =========================

    const {
      data: categoriesData,
      error: categoriesError,
    } = await supabase
      .from("categories")
      .select("id, name")
      .order("position", {
        ascending: true,
      });

    if (categoriesError) {
      console.error(categoriesError);

      setMessage(
        `No pudimos cargar las categorías: ${categoriesError.message}`
      );

      setLoading(false);
      return;
    }

    const categoryList: Category[] = categoriesData ?? [];

    setCategories(categoryList);

    // =========================
    // PRODUCTOS
    // =========================

    const {
      data: productData,
      error: productsError,
    } = await supabase
      .from("products")
      .select("*")
      .order("category_id", {
        ascending: true,
      })
      .order("position", {
        ascending: true,
      });

    if (productsError) {
      console.error(productsError);

      setMessage(
        `No pudimos cargar los productos: ${productsError.message}`
      );

      setLoading(false);
      return;
    }

    const formattedProducts: ProductWithCategory[] = (
      productData ?? []
    ).map((product) => {
      const category = categoryList.find(
        (item) => item.id === product.category_id
      );

      return {
        ...product,

        // Por seguridad, si los campos todavía
        // vienen como null desde Supabase.
        recommended: product.recommended ?? false,
        is_new: product.is_new ?? false,

        categoryName: category?.name ?? "Sin categoría",
      };
    });

    setProducts(formattedProducts);
    setLoading(false);
  };

  // =========================
  // FILTROS
  // =========================

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const matchesCategory =
      selectedCategory === null ||
      product.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // =========================
  // ACTUALIZAR PRODUCTO
  // =========================

  const updateProduct = async (
    id: number,
    changes: Partial<Product>
  ) => {
    setSavingId(id);
    setMessage("");

    const { error } = await supabase
      .from("products")
      .update(changes)
      .eq("id", id);

    if (error) {
      console.error(error);

      setMessage(
        `No pudimos guardar los cambios: ${error.message}`
      );

      setSavingId(null);
      return false;
    }

    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              ...changes,

              categoryName:
                changes.category_id !== undefined
                  ? categories.find(
                      (category) =>
                        category.id === changes.category_id
                    )?.name ?? "Sin categoría"
                  : product.categoryName,
            }
          : product
      )
    );

    setMessage("Cambios guardados correctamente.");

    setSavingId(null);

    window.setTimeout(() => {
      setMessage("");
    }, 2500);

    return true;
  };

  // =========================
  // DISPONIBILIDAD
  // =========================

  const toggleAvailability = async (
    product: ProductWithCategory
  ) => {
    await updateProduct(product.id, {
      available: !product.available,
    });
  };

  // =========================
  // RECOMENDADO
  // =========================

  const toggleRecommended = async (
    product: ProductWithCategory
  ) => {
    await updateProduct(product.id, {
      recommended: !product.recommended,
    });
  };

  // =========================
  // NUEVO
  // =========================

  const toggleNew = async (
    product: ProductWithCategory
  ) => {
    await updateProduct(product.id, {
      is_new: !product.is_new,
    });
  };

  // =========================
  // CAMBIOS DE PRECIO
  // =========================

  const handlePriceChange = (
    id: number,
    value: string
  ) => {
    const numericValue = Number(
      value.replace(/\D/g, "")
    );

    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              price: numericValue,
            }
          : product
      )
    );
  };

  // =========================
  // CAMBIO DE NOMBRE
  // =========================

  const handleNameChange = (
    id: number,
    value: string
  ) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              name: value,
            }
          : product
      )
    );
  };

  // =========================
  // CAMBIO DE CATEGORÍA
  // =========================

  const handleCategoryChange = (
    id: number,
    categoryId: number
  ) => {
    const category = categories.find(
      (item) => item.id === categoryId
    );

    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              category_id: categoryId,
              categoryName:
                category?.name ?? "Sin categoría",
            }
          : product
      )
    );
  };

  // =========================
  // CAMBIO DE POSICIÓN
  // =========================

  const handlePositionChange = (
    id: number,
    value: string
  ) => {
    const numericValue = Number(
      value.replace(/\D/g, "")
    );

    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              position: numericValue,
            }
          : product
      )
    );
  };

  // =========================
  // DESCRIPCIÓN
  // =========================

  const handleDescriptionChange = (
    id: number,
    value: string
  ) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              description: value,
            }
          : product
      )
    );
  };

  // =========================
  // GUARDAR PRODUCTO
  // =========================

  const saveProduct = async (
    product: ProductWithCategory
  ) => {
    const name = product.name.trim();

    if (!name) {
      setMessage(
        "El producto debe tener un nombre."
      );
      return;
    }

    if (!product.category_id) {
      setMessage(
        "Selecciona una categoría."
      );
      return;
    }

    if (!product.price || product.price <= 0) {
      setMessage(
        "El precio debe ser mayor que cero."
      );
      return;
    }

    const slug = createSlug(name);

    if (!slug) {
      setMessage(
        "No pudimos generar el slug del producto."
      );
      return;
    }

    await updateProduct(product.id, {
      name,
      slug,
      category_id: product.category_id,
      position: product.position,
      price: product.price,
      description:
        product.description?.trim() || null,

      // ⭐ RECOMENDADO
      recommended: product.recommended,

      // 🆕 NUEVO
      is_new: product.is_new,
    });
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
  // CAMBIAR IMAGEN
  // =========================

  const handleImageChange = async (
    product: ProductWithCategory,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

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

    setUploadingId(product.id);
    setMessage("");

    const extension =
      file.name.split(".").pop() || "jpg";

    const fileName =
      `${product.id}-${Date.now()}.${extension}`;

    const filePath =
      `products/${fileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from("product-images")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
          }
        );

    if (uploadError) {
      console.error(uploadError);

      setMessage(
        `No pudimos subir la imagen: ${uploadError.message}`
      );

      setUploadingId(null);
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
      .from("products")
      .update({
        image_url: newImageUrl,
      })
      .eq("id", product.id);

    if (updateError) {
      console.error(updateError);

      await supabase.storage
        .from("product-images")
        .remove([filePath]);

      setMessage(
        `No pudimos actualizar la imagen: ${updateError.message}`
      );

      setUploadingId(null);
      event.target.value = "";

      return;
    }

    const oldPath =
      getStoragePath(product.image_url);

    if (oldPath) {
      const {
        error: deleteOldError,
      } = await supabase.storage
        .from("product-images")
        .remove([oldPath]);

      if (deleteOldError) {
        console.warn(
          "No pudimos eliminar la imagen anterior:",
          deleteOldError
        );
      }
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? {
              ...item,
              image_url: newImageUrl,
            }
          : item
      )
    );

    setMessage(
      "Imagen actualizada correctamente."
    );

    setUploadingId(null);
    event.target.value = "";

    window.setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  // =========================
  // ELIMINAR PRODUCTO
  // =========================

  const deleteProduct = async (
    product: ProductWithCategory
  ) => {
    const confirmed =
      window.confirm(
        `¿Seguro que quieres eliminar "${product.name}"?\n\nEsta acción no se puede deshacer.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setMessage("");

    const imagePath =
      getStoragePath(product.image_url);

    if (imagePath) {
      const {
        error: imageError,
      } = await supabase.storage
        .from("product-images")
        .remove([imagePath]);

      if (imageError) {
        console.warn(
          "No pudimos eliminar la imagen:",
          imageError
        );
      }
    }

    const { error } =
      await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

    if (error) {
      console.error(error);

      setMessage(
        `No pudimos eliminar el producto: ${error.message}`
      );

      setDeletingId(null);
      return;
    }

    setProducts((current) =>
      current.filter(
        (item) => item.id !== product.id
      )
    );

    setMessage(
      "Producto eliminado correctamente."
    );

    setDeletingId(null);

    window.setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="products-admin-page">
        <p>Cargando productos...</p>
      </main>
    );
  }

  // =========================
  // RENDER
  // =========================

  return (
    <main className="products-admin-page">

      <header className="products-admin-header">

        <div>
          <span className="products-admin-eyebrow">
            IL TRAMONTO · MIRADOR OCULTO
          </span>

          <h1>
            Productos
          </h1>

          <p>
            Administración de la carta
          </p>
        </div>

        <div className="products-admin-actions">

          <button
            type="button"
            onClick={() =>
              setShowCategories(
                (current) => !current
              )
            }
            className="products-admin-button"
          >
            {showCategories
              ? "CERRAR CATEGORÍAS"
              : "⚙ CATEGORÍAS"}
          </button>

          <button
            type="button"
            onClick={() =>
              setShowNewProduct(true)
            }
            className="products-admin-button products-admin-new-button"
          >
            + NUEVO PRODUCTO
          </button>

          <button
            type="button"
            onClick={loadProducts}
            className="products-admin-button"
          >
            ↻ ACTUALIZAR
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="products-admin-button"
          >
            CERRAR SESIÓN
          </button>

        </div>

      </header>

      {showCategories && (
        <CategoryManager
          onChanged={async () => {
            await loadProducts();
          }}
        />
      )}

      {message && (
        <div className="products-admin-message">
          {message}
        </div>
      )}

      <section className="products-admin-filters">

        <div className="products-admin-search">

          <label htmlFor="product-search">
            BUSCAR PRODUCTO
          </label>

          <input
            id="product-search"
            type="text"
            placeholder="Nombre del producto..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="products-admin-categories">

          <span>
            CATEGORÍA
          </span>

          <div className="products-admin-category-list">

            <button
              type="button"
              className={
                selectedCategory === null
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedCategory(null)
              }
            >
              TODAS
            </button>

            {categories.map(
              (category) => (
                <button
                  key={category.id}
                  type="button"
                  className={
                    selectedCategory ===
                    category.id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedCategory(
                      category.id
                    )
                  }
                >
                  {category.name}
                </button>
              )
            )}

          </div>

        </div>

        <div className="products-admin-results">

          <strong>
            {filteredProducts.length}
          </strong>

          {filteredProducts.length === 1
            ? " producto encontrado"
            : " productos encontrados"}

        </div>

      </section>

      <section className="products-admin-list">

        {products.length === 0 ? (

          <div className="products-admin-empty">

            <span>
              NESSUN PRODOTTO
            </span>

            <h2>
              No hay productos registrados.
            </h2>

          </div>

        ) : filteredProducts.length === 0 ? (

          <div className="products-admin-empty">

            <span>
              NESSUN RISULTATO
            </span>

            <h2>
              No encontramos productos.
            </h2>

            <p>
              Prueba con otro nombre o categoría.
            </p>

          </div>

        ) : (

          filteredProducts.map(
            (product) => (

              <article
                key={product.id}
                className={`products-admin-card ${
                  product.available
                    ? ""
                    : "is-unavailable"
                }`}
              >

                {/* =========================
                    FOTO
                ========================= */}

                <div className="products-admin-photo">

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                    />
                  ) : (
                    <div className="products-admin-photo-empty">
                      SIN FOTO
                    </div>
                  )}

                  <label className="products-admin-photo-button">

                    {uploadingId ===
                    product.id
                      ? "SUBIENDO..."
                      : product.image_url
                      ? "CAMBIAR FOTO"
                      : "SUBIR FOTO"}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(
                          product,
                          e
                        )
                      }
                      disabled={
                        uploadingId ===
                          product.id ||
                        deletingId ===
                          product.id
                      }
                      hidden
                    />

                  </label>

                </div>

                {/* =========================
                    INFORMACIÓN
                ========================= */}

                <div className="products-admin-main">

                  <div className="products-admin-category">
                    {product.categoryName}
                  </div>

                  <div className="products-admin-field">

                    <label
                      htmlFor={`category-${product.id}`}
                    >
                      CATEGORÍA
                    </label>

                    <select
                      id={`category-${product.id}`}
                      value={
                        product.category_id
                      }
                      onChange={(e) =>
                        handleCategoryChange(
                          product.id,
                          Number(
                            e.target.value
                          )
                        )
                      }
                      disabled={
                        savingId ===
                          product.id ||
                        deletingId ===
                          product.id
                      }
                    >
                      {categories.map(
                        (category) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {category.name}
                          </option>
                        )
                      )}
                    </select>

                  </div>

                  <div className="products-admin-field">

                    <label
                      htmlFor={`name-${product.id}`}
                    >
                      NOMBRE
                    </label>

                    <input
                      id={`name-${product.id}`}
                      type="text"
                      value={product.name}
                      onChange={(e) =>
                        handleNameChange(
                          product.id,
                          e.target.value
                        )
                      }
                      disabled={
                        savingId ===
                          product.id ||
                        deletingId ===
                          product.id
                      }
                    />

                  </div>

                  <div className="products-admin-id">
                    Producto #{product.id}
                  </div>

                </div>

                {/* =========================
                    EDICIÓN
                ========================= */}

                <div className="products-admin-edit">

                  <div className="products-admin-field">

                    <label
                      htmlFor={`price-${product.id}`}
                    >
                      PRECIO
                    </label>

                    <input
                      id={`price-${product.id}`}
                      type="text"
                      value={product.price}
                      onChange={(e) =>
                        handlePriceChange(
                          product.id,
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="products-admin-field">

                    <label
                      htmlFor={`position-${product.id}`}
                    >
                      POSICIÓN
                    </label>

                    <input
                      id={`position-${product.id}`}
                      type="number"
                      min="0"
                      value={product.position}
                      onChange={(e) =>
                        handlePositionChange(
                          product.id,
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="products-admin-field">

                    <label
                      htmlFor={`description-${product.id}`}
                    >
                      DESCRIPCIÓN
                    </label>

                    <textarea
                      id={`description-${product.id}`}
                      value={
                        product.description ?? ""
                      }
                      onChange={(e) =>
                        handleDescriptionChange(
                          product.id,
                          e.target.value
                        )
                      }
                      rows={3}
                    />

                  </div>

                </div>

                {/* =========================
                    DESTACADOS
                ========================= */}

                <div className="products-admin-badges">

                  <button
                    type="button"
                    className={`products-admin-badge ${
                      product.recommended
                        ? "active recommended"
                        : ""
                    }`}
                    onClick={() =>
                      toggleRecommended(product)
                    }
                    disabled={
                      savingId === product.id ||
                      deletingId === product.id
                    }
                  >
                    <span>
                      ⭐
                    </span>

                    {product.recommended
                      ? "RECOMENDADO"
                      : "MARCAR RECOMENDADO"}
                  </button>

                  <button
                    type="button"
                    className={`products-admin-badge ${
                      product.is_new
                        ? "active new"
                        : ""
                    }`}
                    onClick={() =>
                      toggleNew(product)
                    }
                    disabled={
                      savingId === product.id ||
                      deletingId === product.id
                    }
                  >
                    <span>
                      🆕
                    </span>

                    {product.is_new
                      ? "NUEVO"
                      : "MARCAR COMO NUEVO"}
                  </button>

                </div>

                {/* =========================
                    ACCIONES
                ========================= */}

                <div className="products-admin-controls">

                  <button
                    type="button"
                    className="products-admin-save"
                    onClick={() =>
                      saveProduct(product)
                    }
                    disabled={
                      savingId ===
                        product.id ||
                      deletingId ===
                        product.id
                    }
                  >
                    {savingId ===
                    product.id
                      ? "GUARDANDO..."
                      : "GUARDAR CAMBIOS"}
                  </button>

                  <button
                    type="button"
                    className={`products-admin-toggle ${
                      product.available
                        ? "active"
                        : "inactive"
                    }`}
                    onClick={() =>
                      toggleAvailability(
                        product
                      )
                    }
                    disabled={
                      savingId ===
                        product.id ||
                      deletingId ===
                        product.id
                    }
                  >
                    {product.available
                      ? "● DISPONIBLE"
                      : "○ NO DISPONIBLE"}
                  </button>

                  <button
                    type="button"
                    className="products-admin-delete"
                    onClick={() =>
                      deleteProduct(
                        product
                      )
                    }
                    disabled={
                      deletingId ===
                        product.id ||
                      uploadingId ===
                        product.id
                    }
                  >
                    {deletingId ===
                    product.id
                      ? "ELIMINANDO..."
                      : "🗑 ELIMINAR"}
                  </button>

                </div>

              </article>
            )
          )
        )}

      </section>

      <footer className="products-admin-footer">

        <span>
          IL TRAMONTO · MIRADOR OCULTO
        </span>

        <a href="/admin/reservas">
          ← IR A RESERVAS
        </a>

      </footer>

      {/* =========================
          NUEVO PRODUCTO
      ========================= */}

      {showNewProduct && (
        <NewProductForm
          onCancel={() =>
            setShowNewProduct(false)
          }
          onCreated={async () => {
            setShowNewProduct(false);

            await loadProducts();

            setMessage(
              "Producto creado correctamente."
            );

            window.setTimeout(() => {
              setMessage("");
            }, 2500);
          }}
        />
      )}

    </main>
  );
}