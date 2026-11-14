"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    SwaggerUIBundle?: (config: { url: string; dom_id: string }) => void
  }
}

const SWAGGER_CSS_URL = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
const SWAGGER_JS_URL = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"

export default function SwaggerPage() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${SWAGGER_CSS_URL}"]`)) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = SWAGGER_CSS_URL
      document.head.appendChild(link)
    }

    const initSwagger = () => {
      if (window.SwaggerUIBundle) {
        window.SwaggerUIBundle({
          url: "/api/swagger",
          dom_id: "#swagger-ui",
        })
      }
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${SWAGGER_JS_URL}"]`
    )

    if (existingScript) {
      initSwagger()
      return
    }

    const script = document.createElement("script")
    script.src = SWAGGER_JS_URL
    script.async = true
    script.onload = initSwagger
    document.body.appendChild(script)
  }, [])

  return <div id="swagger-ui" style={{ minHeight: "100vh" }} />
}
