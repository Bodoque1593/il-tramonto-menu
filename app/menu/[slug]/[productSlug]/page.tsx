import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  position: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface PageProps {
  params: Promise<{
    slug: string;
    productSlug: string;
  }>;
}

export default async function ProductPage({
  params,
}: PageProps) {
  const {
    slug,
    productSlug,
  } = await params;

  // =========================
  // CATEGORÍA
  // =========================

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!category) {
    notFound();
  }

  // =========================
  // PRODUCTO
  // =========================

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", category.id)
    .eq("slug", productSlug)
    .eq("available", true)
    .single();

  if (!product) {
    notFound();
  }

  // =========================
  // TODOS LOS PRODUCTOS
  // =========================

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", category.id)
    .eq("available", true)
    .order("position", {
      ascending: true,
    });

  const productList = (products || []) as Product[];

  const currentIndex = productList.findIndex(
    (item) => item.id === product.id
  );

  const previousProduct =
    currentIndex > 0
      ? productList[currentIndex - 1]
      : null;

  const nextProduct =
    currentIndex < productList.length - 1
      ? productList[currentIndex + 1]
      : null;

  return (
    <main className="product-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="product-header">

        <Link
          href={`/menu/${category.slug}`}
          className="product-back"
        >
          ← {category.name}
        </Link>

      </header>


      {/* =========================
          PRODUCTO
      ========================= */}

      <section className="product-detail">

        {/* IMAGEN */}

        <div className="product-detail-image">

          {product.image_url ? (

            <img
              src={product.image_url}
              alt={product.name}
            />

          ) : (

            <div className="product-detail-placeholder">

              <span>
                IL TRAMONTO
              </span>

              <small>
                FOTO PROSSIMAMENTE
              </small>

            </div>

          )}

        </div>


        {/* INFORMACIÓN */}

        <div className="product-detail-info">

          <span className="product-detail-eyebrow">
            {category.name}
          </span>

          <h1>
            {product.name}
          </h1>

          <div className="product-detail-line" />

          {product.description && (
            <p className="product-detail-description">
              {product.description}
            </p>
          )}

          <div className="product-detail-price">
            $
            {product.price.toLocaleString("es-CO")}
          </div>

          <p className="product-detail-note">
            Preparado al momento en Il Tramonto.
          </p>

        </div>

      </section>


      {/* =========================
          NAVEGACIÓN
      ========================= */}

      <nav className="product-navigation">

        {previousProduct ? (

          <Link
            href={`/menu/${category.slug}/${previousProduct.slug}`}
            className="product-nav-link"
          >

            <span>
              ← ANTERIOR
            </span>

            <strong>
              {previousProduct.name}
            </strong>

          </Link>

        ) : (

          <span className="product-nav-empty" />

        )}


        <Link
          href={`/menu/${category.slug}`}
          className="product-nav-center"
        >
          VER {category.name.toUpperCase()}
        </Link>


        {nextProduct ? (

          <Link
            href={`/menu/${category.slug}/${nextProduct.slug}`}
            className="product-nav-link product-nav-next"
          >

            <span>
              SIGUIENTE →
            </span>

            <strong>
              {nextProduct.name}
            </strong>

          </Link>

        ) : (

          <span className="product-nav-empty" />

        )}

      </nav>


      {/* =========================
          FOOTER
      ========================= */}

      <footer className="product-footer">

        <span>
          IL TRAMONTO · MIRADOR OCULTO
        </span>

        <span>
          CUCINA ITALIANA · ANAPOIMA
        </span>

      </footer>

    </main>
  );
}