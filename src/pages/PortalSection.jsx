function PortalSection({ eyebrow, title, description }) {
    return (
        <section className="portal-page">
            <p className="portal-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="portal-lede">{description}</p>
        </section>
    );
}

export default PortalSection;