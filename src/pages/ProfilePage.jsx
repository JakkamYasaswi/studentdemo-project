import { useAuth } from "../context/useAuth";

function ProfilePage({ title }) {
    const { user, role } = useAuth();
    const profileFields = [
        ["Name", user?.name],
        ["Email", user?.email],
        ["User ID", user?.userId ?? user?.id],
        ["Role", role]
    ].filter(([, value]) => value);

    return (
        <section className="portal-page">
            <h1>{title}</h1>
            <dl className="profile-details">
                {profileFields.map(([label, value]) => (
                    <div className="profile-detail" key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

export default ProfilePage;