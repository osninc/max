import { useState } from "react"
import { Layout } from "../components"
import Main from "./Main"
import ProtectedRoute from "./ProtectedRoute"

export const App = props => {
    const [debugMenu, setDebugMenu] = useState({
        useOutseta: true
    })
    return (
        <Layout onChangeDebugMenu={(options) => setDebugMenu(options)}>
            {debugMenu.useOutseta ? (
                <ProtectedRoute>
                    <Main debugOptions={debugMenu} />
                </ProtectedRoute>
            ) : (
                <Main debugOptions={debugMenu} />
            )}
        </Layout>
    )
}