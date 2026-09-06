import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MonthlyFeature from "./components/MonthlyFeature";
import ReservationForm from "./components/ReservationForm";
export default async function Home() {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("position");

    const { data: featured } = await supabase
  .from("featured_content")
  .select("*")
  .eq("active", true)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

  if (error) {
    return (
      <main className="error-page">
        <h1>Error de conexión</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
 <main className="home-page">

  <MonthlyFeature featured={featured} />

  {/* HERO */}

      <section className="hero">

        <div className="hero-top">

          <div className="brand">

            <h1>IL TRAMONTO</h1>

            <p>Mirador Oculto</p>

            <div className="italy-flag">
              <span />
              <span />
              <span />
            </div>

          </div>

        </div>


        <div className="hero-center">

          <span className="eyebrow">
            CUCINA ITALIANA · ANAPOIMA
          </span>

          <h2>
            Una carta para
            <br />
            disfrutar sin prisa.
          </h2>

          <p>
            Sabores italianos, ingredientes seleccionados
            <br className="desktop-break" />
            y una vista hecha para quedarse un rato más.
          </p>

          <Link
            href="#menu"
            className="hero-button"
          >
            EXPLORAR EL MENÚ
            <span>↓</span>
          </Link>

        </div>


        <div className="hero-bottom">

          <span>IL TRAMONTO</span>

          <span>SCORRI PER SCOPRIRE</span>

        </div>

      </section>


      {/* =========================
          MENU
      ========================= */}

      <section
        id="menu"
        className="menu-section"
      >

        <header className="section-heading">

          <span>LA NOSTRA CARTA</span>

          <h2>IL MENÙ</h2>

          <div className="heading-line" />

          <p>
            Una selección de nuestra cocina para
            acompañar cada momento.
          </p>

        </header>


        <div className="categories">

          {categories?.map((category) => (

            <Link
              key={category.id}
              href={`/menu/${category.slug}`}
              className="category-card"
            >

              <span className="category-number">
                {String(category.position).padStart(2, "0")}
              </span>

              <div className="category-info">

                <h3>
                  {category.name}
                </h3>

                <p>
                  {category.description}
                </p>

              </div>

              <span className="category-arrow">
                →
              </span>

            </Link>

          ))}

        </div>

      </section>


      {/* =========================
          CLOSING SECTION
      ========================= */}

      <section
  id="reservar"
  className="closing-section"
>

        <div className="closing-content">

          <span className="closing-eyebrow">
            UNA SERATA AL TRAMONTO
          </span>

          <h2>
            Mangia.
            <br />
            Bevi.
            <br />
            Rimani.
          </h2>

          <div className="closing-line" />

          <p>
            Il Tramonto · Mirador Oculto
          </p>

        <ReservationForm />

        </div>

      </section>


      {/* =========================
          FOOTER
      ========================= */}

      <footer className="site-footer">

        <div className="footer-brand">
          IL TRAMONTO
        </div>

        <div className="footer-location">
          MIRADOR OCULTO · ANAPOIMA
        </div>

        <div className="footer-copy">
          © {new Date().getFullYear()} Il Tramonto
        </div>

      </footer>

    </main>
  );
}