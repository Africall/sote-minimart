import * as React from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "gradient" | "interactive";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant (optional). Defaults to "default". */
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "rounded-lg border bg-card text-card-foreground shadow-sm",
  elevated:
    "rounded-xl border-2 border-primary/10 bg-card text-card-foreground shadow-elegant",
  gradient:
    // subtle gradient fill with transparent border for a premium look
    "rounded-xl border-2 border-transparent bg-gradient-to-br from-primary/5 to-secondary/5 text-card-foreground shadow-lg",
  interactive:
    // hover lift and stronger shadow for clickable cards
    "rounded-xl border bg-card text-card-foreground shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer",
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
