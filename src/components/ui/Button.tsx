import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium tracking-[-0.01em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:bg-brand",
        primary: "border-primary bg-primary text-primary-foreground hover:bg-brand",
        subtle: "border-border bg-secondary text-secondary-foreground hover:bg-accent",
        secondary: "border-border bg-card text-foreground hover:bg-secondary",
        outline: "border-border bg-card text-foreground hover:border-foreground",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:text-foreground",
        destructive: "border-destructive bg-destructive text-[color:var(--destructive-foreground)] hover:brightness-95",
      },
      size: {
        sm: "h-9 px-3.5 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> { }

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
