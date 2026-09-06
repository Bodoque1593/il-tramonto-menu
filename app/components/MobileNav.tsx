import Link from "next/link";

export default function MobileNav() {
  return (
    <nav className="mobile-nav">

      <Link
        href="/#menu"
        className="mobile-nav-item"
      >
        <span className="mobile-nav-icon">
          ☰
        </span>

        <span>
          MENÚ
        </span>
      </Link>


      <Link
        href="/"
        className="mobile-nav-logo"
      >
        <span>
          IL
        </span>

        <small>
          TRAMONTO
        </small>
      </Link>


      <Link
        href="/#reservar"
        className="mobile-nav-item"
      >
        <span className="mobile-nav-icon">
          ✦
        </span>

        <span>
          RESERVAR
        </span>
      </Link>

    </nav>
  );
}