import { Outlet } from "react-router-dom";
import { AppNavbar } from "./AppNavbar";

export const AppLayout = () => {
  return (
    <>
      <AppNavbar />

      <main className="page">
        <Outlet />
      </main>
    </>
  );
};
