import { Button } from "@/components/ui/button";
import { Home, Play, BookOpen, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLiveLectures } from "@/hooks/useLiveLectures";

const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { liveLectures } = useLiveLectures();

  const hasLiveLectures = liveLectures.some(lecture => lecture.isLive);

  const navItems = [
    { icon: Home, label: "Home", path: "/", hasIndicator: false },
    { icon: Play, label: "Live", path: "/live-classes", hasIndicator: hasLiveLectures },
    { icon: BookOpen, label: "Subjects", path: "/subjects", hasIndicator: false },
    { icon: Users, label: "Community", path: "/community", hasIndicator: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={user ? item.path : "/auth"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 h-auto py-2 px-3 relative ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.hasIndicator && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Navigation;