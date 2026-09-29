import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function PortalDashboard({ eyebrow, title, description, links }) {
    const { user } = useAuth();

    return (
        <section className="portal-page">
            {eyebrow && <p className="portal-eyebrow">{eyebrow}</p>}
            <h1>{title}{user?.name ? `, ${user.name}` : ""}</h1>
            <p className="portal-lede">{description}</p>

            {links.length > 0 && (
                <div className="portal-link-grid">
                    {links.map((link) => (
                        <Link className="portal-link-tile" to={link.to} key={link.to}>
                            <span className="portal-tile-label">{link.label}</span>
                            <span className="portal-tile-description">{link.description}</span>
                            <span className="portal-tile-arrow" aria-hidden="true">→</span>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}

export default PortalDashboard;