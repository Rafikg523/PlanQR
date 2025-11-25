import { createBrowserRouter, RouteObject } from "react-router-dom";
import App from "../../App";
import LecturerPlan from "../features/LecturerPlan";
import PlanDetails from "../features/PlanDetails";
import Tablet from "../layout/Tablet";
import AdminPanel from "../admin/AdminPanel";
import RegistryPage from "../features/registry/RegistryPage";
import AdminRegistryPanel from "../features/admin/AdminRegistryPanel";

export const routes: RouteObject[] = [
    {
        path: '/',
        element: <App />,
        children: [
            { path: 'LecturerPlan/:teacher', element: <LecturerPlan /> },
            { path: ':department/:room', element: <PlanDetails /> },
            { path: 'tablet/:room/:secretUrl', element: <Tablet /> },
            { path: 'AdminPanel', element: <AdminPanel /> },
            { path: 'admin/registry', element: <AdminRegistryPanel /> },
            { path: 'registry', element: <RegistryPage /> }
        ]
    }
]

export const router = createBrowserRouter(routes);