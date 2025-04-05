import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

type CountdownTimerProps = {
  endTime: Date | string;
  className?: string;
};

const CountdownTimer = ({ endTime, className = "" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; days: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
  });
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(endTime);
      const timeDiff = end.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        // Auction has ended
        clearInterval(intervalId);
        return { days: 0, hours: 0, minutes: 0 };
      }
      
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      // Set isEnding flag if less than 3 hours left
      setIsEnding(timeDiff < 3 * 60 * 60 * 1000);
      
      return { days, hours, minutes };
    };
    
    // Calculate immediately
    setTimeLeft(calculateTimeLeft());
    
    // Then update every minute
    intervalId = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [endTime]);
  
  const formatTime = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else {
      return `${timeLeft.minutes}m`;
    }
  };
  
  return (
    <p className={`font-medium text-sm flex items-center ${isEnding ? 'text-red-500 animate-pulse' : 'text-neutral-700'} ${className}`}>
      <Clock className="h-3 w-3 mr-1" />
      {formatTime()}
    </p>
  );
};

export default CountdownTimer;
