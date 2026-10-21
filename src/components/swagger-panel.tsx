"use client"

import { useEffect, useState } from "react"

type SwaggerBundle = (options: { url: string; dom_id: string }) => void

declare global {
  interface Window {
    SwaggerUIBundle?: SwaggerBundle
  }
}

export function SwaggerPanel() {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const css = document.createElement("link")
    css.rel = "stylesheet"
    css.href = "https://unpkg.com/swagger-ui-dist@5.29.0/swagger-ui.css"
    document.head.appendChild(css)

    const script = document.createElement("script")
    script.src = "https://unpkg.com/swagger-ui-dist@5.29.0/swagger-ui-bundle.js"
    script.async = true
    script.onload = () => {
      window.SwaggerUIBundle?.({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
      })
    }
    script.onerror = () => setFailed(true)
    document.body.appendChild(script)

    return () => {
      script.remove()
      css.remove()
    }
  }, [])

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold tracking-tight">Swagger UI</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Loaded from the OpenAPI file. Authorize with the <code>sms_session</code> cookie
        before trying the download route.
      </p>
      {failed ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Swagger UI did not load. The tables below, and{" "}
          <a className="underline-offset-4 hover:underline" href="/openapi.yaml">
            /openapi.yaml
          </a>
          , still describe the routes.
        </p>
      ) : (
        <div id="swagger-ui" className="mt-4 overflow-hidden rounded-xl bg-white ring-1 ring-foreground/10" />
      )}
    </section>
  )
}
