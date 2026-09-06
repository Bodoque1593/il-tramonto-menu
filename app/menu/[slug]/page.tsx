import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
export const dynamic = "force-dynamic";

interface Category {
  id: number;
  name: string;
  description: string | null;
  slug: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number;
  recommended: boolean;
  is_new: boolean;
}

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;

  // =========================
  // CATEGORÍA
  // =========================

  const { data: category, error: categoryError } =
    await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .single();

  if (categoryError || !category) {
    notFound();
  }

  // =========================
  // PRODUCTOS
  // =========================

  const {
    data: products,
    error: productsError,
  } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", category.id)
    .eq("available", true)
    .order("position", {
      ascending: true,
    });

  if (productsError) {
    return (
      <main className="category-page">
        <div className="category-error">
          <p>
            No pudimos cargar esta carta.
          </p>
        </div>
      </main>
    );
  }

  const productList: Product[] =
    products ?? [];

  return (
    <main className="category-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="category-header">

        <Link
          href="/#menu"
          className="category-back"
        >
          ← IL MENÙ
        </Link>

        <div className="category-heading">

          <span className="category-eyebrow">
            LA NOSTRA CARTA
          </span>

          <h1>
            {category.name}
          </h1>

          {category.description && (
            <p>
              {category.description}
            </p>
          )}

        </div>

      </header>


      {/* =========================
          PRODUCTOS
      ========================= */}

      <section className="category-products">

        {productList.length === 0 ? (

          <div className="category-empty">

            <span>
              PROSSIMAMENTE
            </span>

            <h2>
              Nuestra selección
            </h2>

            <p>
              Estamos preparando esta
              sección del menú.
            </p>

          </div>

        ) : (

          <div className="product-grid">

            {productList.map(
              (product) => (

                <Link
                  key={product.id}
                  href={`/menu/${slug}/${product.slug}`}
                  className="product-card"
                >

                  {/* =========================
                      IMAGEN
                  ========================= */}

                  <div
                    className={`product-card-image ${
                      product.image_url
                        ? "has-image"
                        : "no-image"
                    }`}
                  >

                    {product.image_url ? (

                      <img
                        src={product.image_url}
                        alt={product.name}
                      />

                    ) : (

                      <div className="product-image-placeholder">

                        <span>
                          IL TRAMONTO
                        </span>

                      </div>

                    )}

                    {/* =========================
                        ETIQUETAS
                    ========================= */}

                    {(product.recommended ||
                      product.is_new) && (

                      <div className="product-card-badges">

                        {product.is_new && (
                          <span className="product-badge product-badge-new">
                            NUOVO
                          </span>
                        )}

                        {product.recommended && (
                          <span className="product-badge product-badge-recommended">
                            CONSIGLIATO
                          </span>
                        )}

                      </div>

                    )}

                  </div>


                  {/* =========================
                      INFORMACIÓN
                  ========================= */}

                  <div className="product-card-content">

                    <div className="product-card-top">

                      <h2>
                        {product.name}
                      </h2>

                      <span className="product-card-arrow">
                        →
                      </span>

                    </div>


                    {product.description && (
                      <p>
                        {product.description}
                      </p>
                    )}


                    <div className="product-card-bottom">

                      <span className="product-card-price">
                        $
                        {product.price.toLocaleString(
                          "es-CO"
                        )}
                      </span>

                    </div>

                  </div>

                </Link>

              )
            )}

          </div>

        )}

      </section>


      {/* =========================
          FOOTER DE NAVEGACIÓN
      ========================= */}

      <nav className="category-navigation">

        <Link
          href="/#menu"
          className="category-navigation-link"
        >
          ← VER TODAS LAS CATEGORÍAS
        </Link>

        <span className="category-navigation-brand">
          IL TRAMONTO · MIRADOR OCULTO
        </span>

      </nav>

    </main>
  );
}