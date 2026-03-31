import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown } from "lucide-react";

interface DropdownMenu {
  id: string;
  name: string;
  options: string[];
}

const PublicNavMenus = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const { data: menus } = useQuery({
    queryKey: ["public-dropdown-menus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dropdown_menus")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DropdownMenu[];
    },
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!menus?.length) return null;

  return (
    <nav ref={navRef} className="bg-white/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 h-12 overflow-x-auto scrollbar-hide">
          {menus.map((menu) => (
            <div key={menu.id} className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  openMenu === menu.id
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {menu.name}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === menu.id ? "rotate-180" : ""}`} />
              </button>

              {openMenu === menu.id && menu.options.length > 0 && (
                <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-popover border border-border rounded-lg shadow-lg py-1 z-50 animate-fade-in">
                  {menu.options.map((option, i) => (
                    <div
                      key={i}
                      className="px-4 py-2.5 text-sm text-popover-foreground hover:bg-muted/50 cursor-default transition-colors"
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default PublicNavMenus;
