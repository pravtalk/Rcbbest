import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Calendar, Play, Pause, AlertTriangle } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

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

interface LiveLecturePlayerProps {
  lecture: LiveLecture;
  onJoinLive?: () => void;
  showPreview?: boolean;
}

const LiveLecturePlayer = ({ lecture, onJoinLive, showPreview = false }: LiveLecturePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handleJoinLive = () => {
    try {
      setIsPlaying(true);
      setVideoError(false);
      onJoinLive?.();
    } catch (error) {
      console.error('Error joining live lecture:', error);
      setVideoError(true);
    }
  };

  const getTimeInfo = () => {
    if (lecture.scheduledTime) {
      const scheduledDate = new Date(lecture.scheduledTime);
      const now = new Date();
      const timeDiff = scheduledDate.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        return {
          status: 'upcoming',
          message: `Starts in ${hours}h ${minutes}m`,
          time: scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else if (timeDiff > -3600000) { // Within last hour
        return {
          status: 'live',
          message: 'Live Now',
          time: scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
    }
    
    return {
      status: lecture.isLive ? 'live' : 'offline',
      message: lecture.isLive ? 'Available Now' : 'Offline',
      time: lecture.scheduledTime ? new Date(lecture.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
    };
  };

  const timeInfo = getTimeInfo();

  if (showPreview) {
    return (
      <div className="gradient-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300">
        <div className="flex items-start gap-4">
          {/* Lecture Avatar */}
          <div className="w-16 h-16 rounded-xl gradient-primary p-3 flex items-center justify-center">
            <div className="text-primary-foreground font-bold text-sm">
              {lecture.instructor.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>

          {/* Lecture Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{lecture.title}</h3>
              <Badge variant="outline" className="bg-warning text-black">
                PRO
              </Badge>
              <Badge 
                variant={timeInfo.status === 'live' ? 'destructive' : timeInfo.status === 'upcoming' ? 'default' : 'secondary'}
                className={timeInfo.status === 'live' ? 'bg-red-500 text-white animate-pulse' : ''}
              >
                {timeInfo.status === 'live' ? '🔴 LIVE' : timeInfo.status === 'upcoming' ? '📅 UPCOMING' : '⏸️ OFFLINE'}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {lecture.instructor}
              </div>
              {timeInfo.time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {timeInfo.time}
                </div>
              )}
              {lecture.scheduledTime && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(lecture.scheduledTime).toLocaleDateString()}
                </div>
              )}
            </div>

            {lecture.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {lecture.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="text-muted-foreground">{timeInfo.message}</div>
                {timeInfo.time && (
                  <div className="font-semibold">
                    {timeInfo.status === 'upcoming' ? 'SCHEDULED FOR' : 'CLASS AT'} {timeInfo.time}
                  </div>
                )}
              </div>

              <Button 
                variant={lecture.isLive || timeInfo.status === 'live' ? "destructive" : "default"}
                size="default"
                onClick={handleJoinLive}
                disabled={!lecture.isLive && timeInfo.status !== 'live'}
                className={lecture.isLive || timeInfo.status === 'live' ? 'animate-pulse' : ''}
              >
                {lecture.isLive || timeInfo.status === 'live' ? (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Join Live
                  </>
                ) : timeInfo.status === 'upcoming' ? (
                  'Set Reminder'
                ) : (
                  'Unavailable'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lecture Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {lecture.title}
                <Badge 
                  variant={timeInfo.status === 'live' ? 'destructive' : 'secondary'}
                  className={timeInfo.status === 'live' ? 'bg-red-500 text-white animate-pulse' : ''}
                >
                  {timeInfo.status === 'live' ? '🔴 LIVE' : '📹 RECORDED'}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {lecture.instructor}
                </div>
                {timeInfo.time && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {timeInfo.time}
                  </div>
                )}
              </div>
            </div>
          </div>
          {lecture.description && (
            <p className="text-muted-foreground">{lecture.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Video Player */}
      {isPlaying || (lecture.isLive && !showPreview) ? (
        <div className="space-y-4">
          {videoError ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Video Load Error</h3>
                  <p className="text-muted-foreground mb-4">
                    Failed to load the video. Please try again or contact support.
                  </p>
                  <Button onClick={() => {
                    setVideoError(false);
                    setIsPlaying(true);
                  }}>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <VideoPlayer
                videoUrl={lecture.videoUrl}
                title={lecture.title}
                description={lecture.description}
                isFree={false}
              />
              
              {/* Video Help Information */}
              <Card>
                <CardContent className="py-4">
                  <div className="text-center text-sm text-muted-foreground">
                    <p className="mb-2">If the video doesn't load properly:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Check your internet connection</li>
                      <li>Verify the video URL is correct and accessible</li>
                      <li>For live streams, ensure the stream is currently active</li>
                      <li>Try refreshing the page or using a different browser</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-20 h-20 rounded-xl gradient-primary p-4 flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {timeInfo.status === 'upcoming' ? 'Lecture Starting Soon' : 
                 timeInfo.status === 'live' ? 'Live Lecture Ready' : 'Lecture Available'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {timeInfo.message}
              </p>
              <Button 
                size="lg"
                onClick={handleJoinLive}
                disabled={!lecture.isLive && timeInfo.status !== 'live'}
                className={lecture.isLive || timeInfo.status === 'live' ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''}
              >
                {lecture.isLive || timeInfo.status === 'live' ? (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Join Live Lecture
                  </>
                ) : (
                  'Set Reminder'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveLecturePlayer;