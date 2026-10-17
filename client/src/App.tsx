import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense } from "react";
import Home from "./pages/Home";
import Insights from "./pages/Insights";
import ArticleDetail from "./pages/ArticleDetail";
import Assessment from "./pages/Assessment";
import Apply from "./pages/Apply";
import FreeAssessment from "./pages/FreeAssessment";
import Waitlist from "./pages/Waitlist";
import ProgramDetails from "./pages/ProgramDetails";
import BookACall from "./pages/BookACall";
import BloodWork from "./pages/BloodWork";
import HrvConditioning from "./pages/HrvConditioning";
import ResourcePage from "./pages/ResourcePage";
import InformationPage from "./pages/InformationPage";
import ResourcesIndex from "./pages/ResourcesIndex";
import { Head } from "./components/Head";
import { RouteAnalytics } from "./components/RouteAnalytics";
import Report from "./pages/Report";
// Report is imported directly: a lazy page renders as a spinner on the first
// server render of each function instance, and the saved report link is the
// page people open from the results email.
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div
      className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin"
      role="status"
      aria-label="Loading"
    />
  </div>
);
function Routes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/apply" component={Apply} />
      <Route path="/free-assessment" component={FreeAssessment} />
      <Route path="/waitlist" component={Waitlist} />
      <Route path="/program" component={ProgramDetails} />
      <Route path="/book-a-call" component={BookACall} />
      <Route path="/call" component={BookACall} />
      <Route path="/blood-work" component={BloodWork} />
      <Route path="/bloodwork" component={BloodWork} />
      <Route path="/hrv-conditioning" component={HrvConditioning} />
      <Route path="/hrv-program" component={HrvConditioning} />
      <Route path="/resources" component={ResourcesIndex} />
      <Route path="/media" component={InformationPage} />
      <Route path="/resources/:slug" component={ResourcePage} />
      <Route path="/about" component={InformationPage} />
      <Route path="/executive-health-performance" component={InformationPage} />
      <Route path="/corporate-health-performance" component={InformationPage} />
      <Route
        path="/training-for-long-term-health"
        component={InformationPage}
      />
      <Route path="/insights" component={Insights} />
      <Route path="/insights/:slug" component={ArticleDetail} />
      <Route path="/report/:token" component={Report} />
      <Route path="/admin">
        <Suspense fallback={<Loading />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/admin/:section">
        <Suspense fallback={<Loading />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/payment/success">
        <Suspense fallback={<Loading />}>
          <PaymentSuccess />
        </Suspense>
      </Route>
      <Route path="/payment/cancel">
        <Suspense fallback={<Loading />}>
          <PaymentCancel />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Head />
          <RouteAnalytics />
          <Toaster />
          <Routes />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
