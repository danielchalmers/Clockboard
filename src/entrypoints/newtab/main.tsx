import { createRoot } from "react-dom/client"

import { NewTabPage } from "~/NewTabPage"
import { ErrorBoundary } from "~/components/StatusViews"
import "~/styles/global.css"

const container = document.getElementById("root")

if (container) {
  createRoot(container).render(
    <ErrorBoundary>
      <NewTabPage />
    </ErrorBoundary>
  )
}
