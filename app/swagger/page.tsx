"use client"

import SwaggerUI from "swagger-ui-react"
// inject Swagger UI stylesheet only on the client (avoids importing global CSS in App Router)
if (typeof window !== "undefined") {
  const href = "https://unpkg.com/swagger-ui-dist/swagger-ui.css";
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
}

export default function SwaggerPage() {
  return (
    <div style={{ height: "100vh" }}>
      <SwaggerUI url="/api/swagger" />
    </div>
  )
}
