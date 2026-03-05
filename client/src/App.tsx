import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "./context/GameContext.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { RoomPage } from "./pages/RoomPage.tsx";

const DevPage = lazy(() =>
  import("./pages/DevPage.tsx").then((m) => ({ default: m.DevPage })),
);

function App() {
  return (
    <GameProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          {import.meta.env.DEV && (
            <>
              <Route
                path="/dev"
                element={
                  <Suspense>
                    <DevPage />
                  </Suspense>
                }
              />
              <Route
                path="/dev/:stageType/:difficulty"
                element={
                  <Suspense>
                    <DevPage />
                  </Suspense>
                }
              />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
