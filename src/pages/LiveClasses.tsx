import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, Video } from "lucide-react";
import Navigation from "@/components/Navigation";
import LiveLecturePlayer from "@/components/LiveLecturePlayer";
import { useLiveLectures } from "@/hooks/useLiveLectures";

interface LiveLecture {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  instructor: string;
  isLive: boolean;
  scheduledTime?: string;
  createdAt: string;
}

const LiveClasses = () => {
  const { liveLectures, loading } = useLiveLectures();
  const [selectedLecture, setSelectedLecture] = useState<LiveLecture | null>(null);

  const handleJoinLive = (lecture: LiveLecture) => {
    setSelectedLecture(lecture);
  };

  const handleBackToList = () => {
    setSelectedLecture(null);
  };

  // If a lecture is selected, show the player
  if (selectedLecture) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBackToList}
                className="text-sm"
              >
                ← Back to Live Classes
              </Button>
              <div className="flex gap-2">
                <Badge variant="outline" className="gradient-accent text-accent-foreground">
                  PREMIUM
                </Badge>
                {selectedLecture.isLive && (
                  <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                    🔴 LIVE
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Lecture Player */}
        <div className="container mx-auto px-4 py-6">
          <LiveLecturePlayer
            lecture={selectedLecture}
            onJoinLive={() => console.log('Joining live lecture:', selectedLecture.title)}
          />
        </div>

        {/* Bottom Navigation */}
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              PraveshCoderZ
            </h1>
            <div className="flex gap-2">
              <Badge variant="outline" className="gradient-accent text-accent-foreground">
                PREMIUM
              </Badge>
              <Badge variant="outline" className="bg-info text-white">
                UPCOMING CLASSES
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Live Classes Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Live Classes</h2>
          <p className="text-muted-foreground">Join upcoming live sessions with expert instructors</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading live classes...</p>
          </div>
        ) : liveLectures.length === 0 ? (
          <div className="text-center py-8">
            <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Live Classes Available</h3>
            <p className="text-muted-foreground">
              Check back later for upcoming live sessions with expert instructors
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {liveLectures.map((classItem) => {
              // Calculate time info for better display
              const getTimeDisplay = () => {
                if (classItem.scheduledTime) {
                  const scheduledDate = new Date(classItem.scheduledTime);
                  const now = new Date();
                  const timeDiff = scheduledDate.getTime() - now.getTime();
                  
                  if (timeDiff > 0) {
                    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                    return {
                      text: `Starts in ${hours}h ${minutes}m`,
                      time: scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                  } else if (timeDiff > -3600000) { // Within last hour
                    return {
                      text: 'Live Now',
                      time: scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                  }
                }
                return {
                  text: classItem.isLive ? 'Available Now' : 'Scheduled',
                  time: classItem.scheduledTime ? new Date(classItem.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
                };
              };

              const timeDisplay = getTimeDisplay();

              return (
                <div
                  key={classItem.id}
                  className="gradient-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Class Avatar */}
                    <div className="w-16 h-16 rounded-xl gradient-primary p-3 flex items-center justify-center">
                      <div className="text-primary-foreground font-bold text-sm">
                        {classItem.instructor.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    </div>

                    {/* Class Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{classItem.title}</h3>
                        <Badge variant="outline" className="bg-warning text-black">
                          PRO
                        </Badge>
                        {classItem.isLive && (
                          <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                            🔴 LIVE
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {classItem.instructor}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {timeDisplay.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          {classItem.isLive ? "Live Stream" : "Scheduled"}
                        </div>
                      </div>

                      {classItem.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {classItem.description}
                        </p>
                      )}

                      <Badge 
                        variant="secondary"
                        className={classItem.isLive ? "bg-red-500 text-white animate-pulse" : "bg-blue-500 text-white"}
                      >
                        {classItem.isLive ? "🔴 LIVE NOW" : "📅 SCHEDULED"}
                      </Badge>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm">
                          <div className="text-muted-foreground">{timeDisplay.text}</div>
                          {timeDisplay.time !== 'N/A' && (
                            <div className="font-semibold">CLASS AT {timeDisplay.time}</div>
                          )}
                        </div>

                        <Button 
                          variant={classItem.isLive ? "destructive" : "default"}
                          size="default"
                          onClick={() => handleJoinLive(classItem)}
                          disabled={!classItem.isLive && !classItem.scheduledTime}
                          className={classItem.isLive ? "animate-pulse" : ""}
                        >
                          {classItem.isLive ? "Join Live" : "Set Reminder"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default LiveClasses;