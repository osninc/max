import { useAuth } from "./AuthProvider";

const PLANS = {
    PRO: { label: "Pro", uid: "yW1qbyWB" },
    BASIC: { label: "Basic", uid: "OW4pw3Wg" }
};

function hasCorrectPlan(plans, user) {
    if (user) {
        const planIdForUser = user.Account?.CurrentSubscription?.Plan?.Uid;
        return !!plans.find((plan) => plan.uid === planIdForUser);
    } else {
        return false;
    }
}

export default function ProtectedRoute({ pro, children }) {
    const { user, openLogin, openSignup, openProfile, isLoading } = useAuth();

    // Pro routes only accessible with pro plan
    // Basic routes accessible with basic or pro plan
    const plansWithAccess = pro ? [PLANS.PRO] : [PLANS.BASIC, PLANS.PRO];
    const allowAccess = hasCorrectPlan(plansWithAccess, user);

    if (isLoading) return <p>Authenticating...</p>;

    if (allowAccess) {
        return children;
    } else if (user) {
        return (
            <>
                <p>
                    To access this content you need to upgrade to the{" "}
                    <strong>{plansWithAccess[0].label}</strong> plan.
                </p>
                <button onClick={() => openProfile({ tab: "planChange" })}>
                    Upgrade
                </button>
            </>
        );
    } else {
        return (
            <>
                <p>
                    To access this content you need to{" "}
                    <button onClick={openSignup}>signup</button> for the{" "}
                    <strong>{plansWithAccess[0].label}</strong> plan.
                </p>

                <p>
                    Or <button onClick={openLogin}>login</button> if you already have an
                    account.
                </p>
            </>
        );
    }
}
