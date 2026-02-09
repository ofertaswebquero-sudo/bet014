import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PAGE_EXPLANATIONS_BY_ROUTE } from "@/components/shared/pageExplanations";

export function PageExplanationButton({
  routePath,
  className,
}: {
  routePath: string;
  className?: string;
}) {
  const content = PAGE_EXPLANATIONS_BY_ROUTE[routePath] ?? PAGE_EXPLANATIONS_BY_ROUTE["*"];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
        >
          <HelpCircle className="h-4 w-4" />
          Como funciona
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] max-w-[min(420px,calc(100vw-2rem))]" align="end">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{content.title}</h4>
            <p className="text-xs text-muted-foreground">{content.description}</p>
          </div>

          <div className="space-y-3">
            {content.sections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{section.title}</p>
                <ul className="space-y-1 text-xs">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
