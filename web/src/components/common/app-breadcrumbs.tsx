import { Fragment } from "react"
import { Link, useMatches } from "react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

/** Isi `handle` sebuah route di `router.tsx` agar muncul di breadcrumb. */
export type RouteHandle = {
  breadcrumb?: string
}

/** Breadcrumb dibentuk dari `handle.breadcrumb` setiap route yang sedang aktif. */
export function AppBreadcrumbs() {
  const matches = useMatches()
  const crumbs = matches.flatMap((match) => {
    const label = (match.handle as RouteHandle | undefined)?.breadcrumb
    return label ? [{ label, pathname: match.pathname }] : []
  })

  if (crumbs.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <Fragment key={crumb.pathname}>
              {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              <BreadcrumbItem className={isLast ? undefined : "hidden md:block"}>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.pathname}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
