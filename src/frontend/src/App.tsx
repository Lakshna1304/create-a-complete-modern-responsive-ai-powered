import { AccessibilityProvider } from "@/components/accessibility/AccessibilityProvider";
import { Layout } from "@/components/layout/Layout";
import AiCorePage from "@/pages/AiCorePage";
import CognitivePage from "@/pages/CognitivePage";
import DeafMutePage from "@/pages/DeafMutePage";
import MobilityPage from "@/pages/MobilityPage";
import VisuallyImpairedPage from "@/pages/VisuallyImpairedPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <AccessibilityProvider>
      <Layout>
        <Outlet />
      </Layout>
    </AccessibilityProvider>
  ),
});

const aiCoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: AiCorePage,
});

const visionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vision",
  component: VisuallyImpairedPage,
});

const communicationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/communication",
  component: DeafMutePage,
});

const cognitionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cognition",
  component: CognitivePage,
});

const mobilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mobility",
  component: MobilityPage,
});

const routeTree = rootRoute.addChildren([
  aiCoreRoute,
  visionRoute,
  communicationRoute,
  cognitionRoute,
  mobilityRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
