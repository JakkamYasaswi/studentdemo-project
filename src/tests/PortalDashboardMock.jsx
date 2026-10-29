
export default function PortalDashboardMock({
  title,
  description,
  links = [],
}) {
  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>

      {links.map((link) => (
        <div key={link.to}>
          <span>{link.label}</span>
          <span>{link.description}</span>
          <span>{link.to}</span>
        </div>
      ))}
    </div>
  );
}
