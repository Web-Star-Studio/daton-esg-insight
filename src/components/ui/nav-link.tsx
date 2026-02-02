import { Link, LinkProps, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
}

/**
 * NavLink - Accessible navigation link with aria-current
 * 
 * WCAG 2.4.8 compliance:
 * - aria-current="page" indicates current location
 * - Helps screen reader users understand navigation context
 */
export function NavLink({ 
  to, 
  className, 
  activeClassName = "font-semibold",
  children,
  ...props 
}: NavLinkProps) {
  const location = useLocation();
  const isActive = typeof to === 'string' && location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(className, isActive && activeClassName)}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      {children}
    </Link>
  );
}
