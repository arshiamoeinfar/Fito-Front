import { Route, Routes } from "react-router-dom";
import DashboardAthlete from "../pages/athlete/Dashboard-Athlete/DashboardAthlete";
import Home from "../pages/Home/Home";
import StartTrain from "../pages/athlete/StartTrain/StartTrain";
import DashBoardNutrition from "../pages/athlete/DashBoardNutrition/DashBoardNutrition";
import AnalysisPage from "../pages/athlete/AnalysisPage/AnalysisPage";
import TrainingPage from "../pages/athlete/TrainingPage/TrainingPage";
import ExerciseGuide from "../pages/athlete/ExerciseGuide/ExerciseGuide";
import Settings from "../pages/Setting/SettingsPage";
import Coach from "../pages/coach/CoachDashboard";
import CoachAthletes from "../pages/coach/CoachAthletes";
import ReportPage from "../pages/coach/ReportPage";
import MessageCoach from "../pages/coach/MessageCoach";
import CoachAssignments from "../pages/coach/CoachAssignments";
import CoachProgram from "../pages/coach/CoachProgram";
import CoachAthleteProfile from "../pages/coach/CoachAthleteProfile";
import CoachSetting from "../pages/coach/Setting";
import WorkoutProgramBuilder from "../pages/coach/WorkoutProgramBuilder";
import CoachExerciseBank from "../pages/coach/CoachExerciseBank";
import CoachPlans from "../pages/coach/CoachPlans";
import CoachNutrition from "../pages/coach/CoachNutrition";
import CoachMeal from "../pages/coach/CoachMeal";
import CoachAssistant from "../pages/coach/CoachAssistant";
import AdminPlans from "../pages/admin/AdminPlans";
import AdminCredit from "../pages/admin/AdminCredit";
import AdminBlog from "../pages/admin/AdminBlog";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminSettings from "../pages/admin/AdminSettings";
import AdminHomepage from "../pages/admin/AdminHomepage";
import Invitations from "../pages/athlete/Invitations";
import AthleteFeedback from "../pages/athlete/AthleteFeedback";
import AthletePlan from "../pages/athlete/AthletePlan";
import AthleteIntake from "../pages/athlete/AthleteIntake";
import RequireAccount from "./RequireAccount";
import Analysis from "../Components/DashBoardAuth/AnalysComponents/Analysis";
import AnalysisToolspage from "../Components/DashBoardAuth/AnalysComponents/AnalysisToolsPage";

import BlogListPage from '../pages/Blog/BlogListPage';
import BlogCategoryPage from '../pages/Blog/BlogCategoryPage';
import BlogPostPage from '../pages/Blog/BlogPostPage';
function guarded(profile, page) {
  return <RequireAccount profile={profile}>{page}</RequireAccount>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboardAthlete" element={guarded("athlete", <DashboardAthlete />)} />
      <Route path="/dashboardnutrition" element={guarded("athlete", <DashBoardNutrition />)} />
      <Route path="/dashboardAthlete/start-training" element={guarded("athlete", <StartTrain />)} />
      <Route path="/AnalysisPage" element={guarded("athlete", <AnalysisPage />)} />
      <Route path="/AnalysisPage/analysis" element={guarded("athlete", <Analysis />)} />
      <Route
        path="/AnalysisPage/tools"
        element={guarded("athlete", <AnalysisToolspage />)}
      />
      <Route path="/trainingpage" element={guarded("athlete", <TrainingPage />)} />
      <Route path="/trainingpage/exercises/:exerciseId" element={guarded("athlete", <ExerciseGuide />)} />
      <Route path="/settings" element={guarded("athlete", <Settings />)} />
      <Route path="/invitations" element={guarded("athlete", <Invitations />)} />
      <Route path="/feedback" element={guarded("athlete", <AthleteFeedback />)} />
      <Route path="/athlete-plan" element={guarded("athlete", <AthletePlan />)} />
      <Route path="/athlete-intake" element={guarded("athlete", <AthleteIntake />)} />
      <Route path="/coach/dashboard" element={guarded("coach", <Coach />)} />
      <Route path="/coach/athletes" element={guarded("coach", <CoachAthletes />)} />
      <Route path="/coach/athletes/:id" element={guarded("coach", <CoachAthleteProfile />)} />
      <Route path="/coach/report" element={guarded("coach", <ReportPage />)} />
      <Route path="/coach/message" element={guarded("coach", <MessageCoach />)} />
      <Route path="/coach/programs" element={guarded("coach", <CoachAssignments />)} />
      <Route path="/coach/programs/:programId" element={guarded("coach", <CoachProgram />)} />
      <Route path="/coach/plans" element={guarded("coach", <CoachPlans />)} />
      <Route path="/coach/builder" element={guarded("coach", <WorkoutProgramBuilder />)} />
      <Route path="/coach/exercises" element={guarded("coach", <CoachExerciseBank />)} />
      <Route path="/coach/nutrition" element={guarded("coach", <CoachNutrition />)} />
      <Route path="/coach/nutrition/:planId" element={guarded("coach", <CoachMeal />)} />
      <Route path="/coach/assistant" element={guarded("coach", <CoachAssistant />)} />
      <Route path="/coach/settings" element={guarded("coach", <CoachSetting />)} />
      <Route path="/admin/plans" element={<AdminPlans />} />
      <Route path="/admin/credits" element={<AdminCredit />} />
      <Route path="/admin/blog" element={<AdminBlog />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/homepage" element={<AdminHomepage />} />

        <Route path="/blog" element={<BlogListPage />} />
    <Route path="/blog/category/:categorySlug" element={<BlogCategoryPage />} />
    <Route path="/blog/:slug" element={<BlogPostPage />} />
    </Routes>
  );
}
