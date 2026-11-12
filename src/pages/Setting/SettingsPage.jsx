import Navbar from "../../Components/shared/Navbar/Navbar";
import SettingsAuth from "../../Components/DashBoardAuth/Settings/SettingsAuth";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <SettingsAuth />
        </div>
      </div>
    </div>
  );
}
