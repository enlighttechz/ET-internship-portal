import { useState, useEffect } from 'react';
import { Trophy, Award, TrendingUp, X } from 'lucide-react';
import gamificationEngine from '../utils/gamificationEngine';

const GameficationUI = ({ studentId, allStudents = [] }) => {
  const [stats, setStats] = useState({ totalPoints: 0, completedAchievements: [] });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [newAchievement, setNewAchievement] = useState(null);

  useEffect(() => {
    const updateStats = () => {
      // Update stats
      const currentStats = gamificationEngine.getData(studentId);
      setStats({
        totalPoints: currentStats.totalPoints,
        completedAchievements: currentStats.achievements,
      });

      // Load leaderboard (simulate from localStorage in MVP)
      const leaderboardData = allStudents
        .map((student) => {
          const data = gamificationEngine.getData(student._id);
          return {
            name: student.name,
            totalPoints: data.totalPoints,
            achievements: data.achievements.length,
            _id: student._id,
          };
        })
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 5);

      setLeaderboard(leaderboardData);
    };

    updateStats();
  }, [studentId, allStudents]);

  // Show achievement notification
  useEffect(() => {
    if (newAchievement) {
      const timer = setTimeout(() => setNewAchievement(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [newAchievement]);

  return (
    <>
      {/* Compact Header Bar Stats */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Points Display */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
          <Trophy size={18} className="text-primary" />
          <span className="font-bold text-sm md:text-base text-primary">
            {stats.totalPoints || 0} pts
          </span>
        </div>

        {/* Achievements Display */}
        {stats.completedAchievements && stats.completedAchievements.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20 group relative">
            <Award size={18} className="text-accent" />
            <span className="font-bold text-sm md:text-base text-accent">
              {stats.completedAchievements.length}
            </span>
            {/* Tooltip showing latest achievements */}
            <div className="hidden group-hover:block absolute top-full right-0 mt-2 bg-surface border border-outline-variant/30 rounded-lg shadow-lg p-3 z-50 w-48 text-xs">
              <p className="font-bold mb-2 text-text-primary">Achievements</p>
              {stats.completedAchievements.slice(-3).map((ach, idx) => (
                <div key={idx} className="flex items-center gap-2 text-text-dim mb-1">
                  <span>{ach.icon}</span>
                  <span>{ach.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Achievement Notification Pop-up */}
      {newAchievement && (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-white border-2 border-accent rounded-2xl shadow-2xl p-6 animate-bounce z-40 max-w-xs">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{newAchievement.icon}</div>
            <div>
              <h4 className="font-bold text-lg text-accent mb-1">
                {newAchievement.name}!
              </h4>
              <p className="text-sm text-text-dim">{newAchievement.description}</p>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default GameficationUI;
