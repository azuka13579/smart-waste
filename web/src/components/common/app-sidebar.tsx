import { Link, useLocation } from "react-router"

import { BrandLogo } from "@/components/common/brand-logo"
import { UserMenu } from "@/components/common/user-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { ROUTES } from "@/lib/constants"
import { isNavItemActive, NAV_GROUPS } from "@/lib/navigation"
import { useSession } from "@/lib/session"

export function AppSidebar() {
  const { user } = useSession()
  const { pathname } = useLocation()
  const { state, isMobile, setOpenMobile } = useSidebar()

  if (!user) return null

  const groups = NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => item.isVisible(user)) })).filter(
    (group) => group.items.length > 0,
  )
  const allUrls = groups.flatMap((group) => group.items.map((item) => item.url))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
        <Link to={ROUTES.HOME} className="px-1">
          <BrandLogo iconOnly={state === "collapsed" && !isMobile} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = isNavItemActive(pathname, item.url, allUrls)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-10 font-medium data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:[&_svg]:text-primary"
                      >
                        <Link to={item.url} onClick={() => setOpenMobile(false)}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
