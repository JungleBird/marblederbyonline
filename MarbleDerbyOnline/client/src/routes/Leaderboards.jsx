import React, { useState } from 'react'
import styled from 'styled-components'

const LeaderboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`

const LeaderboardSection = styled.div`
  background: linear-gradient(180deg, rgba(138, 77, 255, 0.08), rgba(26, 10, 46, 0.4));
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 6px 18px rgba(138, 77, 255, 0.2);
  border: 1px solid rgba(138, 77, 255, 0.3);
`

const LeaderboardTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #d17aff;
  font-size: 20px;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: rgba(138, 77, 255, 0.2);
  }
  
  th {
    padding: 14px;
    text-align: left;
    color: #d17aff;
    font-weight: 600;
    border-bottom: 2px solid rgba(138, 77, 255, 0.3);
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  td {
    padding: 14px;
    color: #c4b5fd;
    border-bottom: 1px solid rgba(138, 77, 255, 0.15);
    font-size: 15px;
  }
  
  tbody tr {
    transition: all 200ms ease-in-out;
    
    &:hover {
      background: rgba(138, 77, 255, 0.1);
    }
  }
  
  tbody tr:last-child td {
    border-bottom: none;
  }
`

const RankBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b1780ff, #b01fffff);
  color: #dadadaff;
  font-weight: 700;
  font-size: 14px;
`

const Username = styled.span`
  font-weight: 600;
  color: #ffa726;
`

const Character = styled.span`
  font-weight: 600;
  color: #830088ff;
`


const Score = styled.span`
  font-weight: 600;
  color: #28d694ff;
  font-size: 16px;
`

const ExpandedRowContent = styled.div`
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-top: 1px solid rgba(138, 77, 255, 0.1);
`

const AchievementLabel = styled.span`
  display: flex;
  font-size: 12px;
  color: #a0a0a0;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
`

const AchievementList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`

const MiniAchievement = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(138, 77, 255, 0.15);
  border: 1px solid rgba(138, 77, 255, 0.3);
  padding: 12px 8px;
  border-radius: 8px;
  font-size: 11px;
  color: #e0e0e0;
  text-align: center;
  width: 72px;
  height: 120px; /* 3:5 ratio */
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    background: rgba(138, 77, 255, 0.25);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    cursor: pointer;
  }
  
  span {
    font-size: 24px;
    margin-bottom: 4px;
  }
`

export default function Leaderboards() {
  const [expandedRows, setExpandedRows] = useState([])

  const toggleRow = (rank) => {
    setExpandedRows(prev => {
      if (prev.includes(rank)) {
        return prev.filter(r => r !== rank)
      } else {
        return [...prev, rank]
      }
    })
  }

  const leaderboardData = [
    { 
      rank: 1, 
      username: 'ProGamer42', 
      character: "Ball", 
      score: 15680,
      achievements: [
        { icon: "⚡", name: "Speed Demon" },
        { icon: "💰", name: "Collector" },
        { icon: "🏆", name: "Champion" }
      ]
    },
    { 
      rank: 2, 
      username: 'ShadowNinja', 
      character: "Ghost", 
      score: 14920,
      achievements: [
        { icon: "👻", name: "Untouchable" },
        { icon: "🌑", name: "Night Owl" }
      ]
    },
    { 
      rank: 3, 
      username: 'PhantomAce', 
      character: "Water Drop", 
      score: 13450,
      achievements: [
        { icon: "💧", name: "Fluidity" },
        { icon: "🌊", name: "Tsunami" }
      ]
    },
    { 
      rank: 4, 
      username: 'ThunderStrike', 
      character: "Ghost", 
      score: 12780,
      achievements: [
        { icon: "⚡", name: "Shockwave" }
      ]
    },
    { 
      rank: 5, 
      username: 'NeonVortex', 
      character: "Ghost", 
      score: 11950,
      achievements: []
    },
    { rank: 6, username: 'CrimsonWolf', character: "Ball", score: 11220, achievements: [{ icon: "🔴", name: "Red Comet" }] },
    { rank: 7, username: 'VoidMaster', character: "Water Drop", score: 10680, achievements: [] },
    { rank: 8, username: 'EchoKnight', character: "Water Drop", score: 9540, achievements: [{ icon: "🔊", name: "Resonance" }] },
    { rank: 9, username: 'NovaBlaze', character: "Ball", score: 8920, achievements: [] },
    { rank: 10, username: 'FrostbyteSR', character: "Ball", score: 8120, achievements: [{ icon: "❄️", name: "Chill" }] }
  ]

  return (
    <>
      <LeaderboardContainer>
        <LeaderboardSection>
          <LeaderboardTitle>🏆 Global Leaderboard</LeaderboardTitle>
          <Table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Character</th>
                <th style={{ textAlign: 'right' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((entry) => (
                <React.Fragment key={entry.rank}>
                  <tr onClick={() => toggleRow(entry.rank)} style={{ cursor: 'pointer' }}>
                    <td>
                      <RankBadge>{entry.rank}</RankBadge>
                    </td>
                    <td>
                      <Username>{entry.username}</Username>
                    </td>
                    <td>
                      <Character>{entry.character}</Character>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Score>{entry.score.toLocaleString()}</Score>
                    </td>
                  </tr>
                  {expandedRows.includes(entry.rank) && (
                    <tr>
                      <td colSpan="4" style={{ padding: 0, borderBottom: 'none' }}>
                        <ExpandedRowContent>
                          <AchievementLabel>Round Achievements</AchievementLabel>
                          <AchievementList>
                            {entry.achievements && entry.achievements.length > 0 ? (
                              entry.achievements.map((ach, i) => (
                                <MiniAchievement key={i}>
                                  <span>{ach.icon}</span> {ach.name}
                                </MiniAchievement>
                              ))
                            ) : (
                              <span style={{ color: '#666', fontSize: '13px' }}>No achievements earned this round.</span>
                            )}
                          </AchievementList>
                        </ExpandedRowContent>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        </LeaderboardSection>
      </LeaderboardContainer>
    </>
  )
}
