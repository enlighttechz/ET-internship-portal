// Gamification Engine for Points, Achievements, and Leaderboard

const STORAGE_KEY = 'gamification_data';
const ACHIEVEMENT_MILESTONES = {
  firstStep: { points: 10, name: 'First Step', icon: '👣', description: 'Complete your first correct answer' },
  risingStar: { points: 100, name: 'Rising Star', icon: '⭐', description: 'Reach 100 points' },
  expertLearner: { points: 500, name: 'Expert Learner', icon: '🎓', description: 'Reach 500 points' },
  master: { points: 1000, name: 'Master', icon: '👑', description: 'Reach 1000 points' },
};

const getStorageKey = (studentId) => `${STORAGE_KEY}_${studentId}`;

const initializeData = (studentId) => {
  const key = getStorageKey(studentId);
  const existing = localStorage.getItem(key);

  if (existing) {
    return JSON.parse(existing);
  }

  const newData = {
    totalPoints: 0,
    sessionPoints: 0,
    achievements: [],
    lastUpdated: Date.now(),
  };

  localStorage.setItem(key, JSON.stringify(newData));
  return newData;
};

const saveData = (studentId, data) => {
  const key = getStorageKey(studentId);
  data.lastUpdated = Date.now();
  localStorage.setItem(key, JSON.stringify(data));
};

export const gamificationEngine = {
  // Get current gamification data for a student
  getData: (studentId) => {
    return initializeData(studentId);
  },

  // Award points based on answer correctness
  awardPoints: (studentId, itemType, isCorrect) => {
    const data = initializeData(studentId);
    const pointsToAdd = isCorrect ? 10 : 5; // 10 for correct, 5 for attempt

    data.totalPoints += pointsToAdd;
    data.sessionPoints += pointsToAdd;

    saveData(studentId, data);
    return data;
  },

  // Check and unlock achievements
  checkAchievements: (studentId) => {
    const data = initializeData(studentId);
    const newAchievements = [];

    Object.entries(ACHIEVEMENT_MILESTONES).forEach(([, achievement]) => {
      // Check if user has reached this milestone and hasn't already unlocked it
      if (
        data.totalPoints >= achievement.points &&
        !data.achievements.find((a) => a.name === achievement.name)
      ) {
        data.achievements.push({
          ...achievement,
          unlockedAt: Date.now(),
        });
        newAchievements.push(achievement);
      }
    });

    if (newAchievements.length > 0) {
      saveData(studentId, data);
    }

    return newAchievements;
  },

  // Get achievement milestones
  getAchievements: () => ACHIEVEMENT_MILESTONES,

  // Get leaderboard data (local session ranking)
  // In Phase 2, this can be replaced with backend call
  getLeaderboardData: (allStudents = []) => {
    const leaderboard = allStudents
      .map((student) => {
        const data = initializeData(student._id);
        return {
          name: student.name,
          totalPoints: data.totalPoints,
          achievements: data.achievements.length,
          _id: student._id,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10); // Top 10

    return leaderboard;
  },

  // Get top 5 performers for quick display
  getTopPerformers: (allStudents = []) => {
    return gamificationEngine.getLeaderboardData(allStudents).slice(0, 5);
  },

  // Reset student's gamification data (admin function)
  resetData: (studentId) => {
    const key = getStorageKey(studentId);
    localStorage.removeItem(key);
    return initializeData(studentId);
  },

  // Get next achievement milestone for motivation
  getNextMilestone: (studentId) => {
    const data = initializeData(studentId);
    const milestones = Object.values(ACHIEVEMENT_MILESTONES).sort(
      (a, b) => a.points - b.points
    );

    for (const milestone of milestones) {
      if (data.totalPoints < milestone.points) {
        return {
          milestone,
          pointsNeeded: milestone.points - data.totalPoints,
          progress: Math.round((data.totalPoints / milestone.points) * 100),
        };
      }
    }

    return null; // All milestones achieved
  },

  // Get cumulative stats
  getStats: (studentId) => {
    const data = initializeData(studentId);
    return {
      totalPoints: data.totalPoints,
      sessionPoints: data.sessionPoints,
      achievements: data.achievements.length,
      completedAchievements: data.achievements,
    };
  },
};

export default gamificationEngine;
