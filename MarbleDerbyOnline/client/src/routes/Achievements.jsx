import React from 'react'
import {
  AchievementsContainer,
  AchievementCard,
  AchievementIcon,
  AchievementTitle,
  AchievementDescription,
  ProgressBar,
  ProgressFill,
  StatusBadge
} from '../styles/Achievements.styles'

const MOCK_ACHIEVEMENTS = [
  {
    id: 1,
    title: "First Steps",
    description: "Complete the tutorial level.",
    icon: "👣",
    progress: 100,
    unlocked: true,
    date: "2023-10-15"
  },
  {
    id: 2,
    title: "Speed Demon",
    description: "Finish a race in under 60 seconds.",
    icon: "⚡",
    progress: 100,
    unlocked: true,
    date: "2023-10-16"
  },
  {
    id: 3,
    title: "Collector",
    description: "Collect 50 gold coins.",
    icon: "💰",
    progress: 65,
    unlocked: false
  },
  {
    id: 4,
    title: "Gravity Master",
    description: "Complete a level without falling off the edge.",
    icon: "🌌",
    progress: 20,
    unlocked: false
  },
  {
    id: 5,
    title: "Marathon Runner",
    description: "Travel a total distance of 10km.",
    icon: "🏃",
    progress: 85,
    unlocked: false
  },
  {
    id: 6,
    title: "Secret Finder",
    description: "Discover the hidden room in the castle.",
    icon: "🗝️",
    progress: 0,
    unlocked: false
  }
]

export default function Achievements() {
  return (
    <AchievementsContainer>
      {MOCK_ACHIEVEMENTS.map((achievement) => (
        <AchievementCard key={achievement.id} className={!achievement.unlocked ? 'locked' : ''}>
          <StatusBadge unlocked={achievement.unlocked}>
            {achievement.unlocked ? 'Unlocked' : 'Locked'}
          </StatusBadge>
          
          <AchievementIcon className={!achievement.unlocked ? 'locked' : ''}>
            {achievement.icon}
          </AchievementIcon>
          
          <AchievementTitle>{achievement.title}</AchievementTitle>
          <AchievementDescription>{achievement.description}</AchievementDescription>
          
          <ProgressBar>
            <ProgressFill progress={achievement.progress} />
          </ProgressBar>
        </AchievementCard>
      ))}
    </AchievementsContainer>
  )
}
