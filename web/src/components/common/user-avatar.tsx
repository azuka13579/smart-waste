import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}
