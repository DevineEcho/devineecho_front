import React from 'react';
import './StatusBar.css';

function StatusBar({ player, onLogout }) {
    return (
        <div className="status-bar">
            <span>캐릭터명: {player.username}</span>
            <span>레벨: {player.level}</span>
            <span>골드: {player.gold}</span>
            <span>다이아: {player.diamond}</span>
            <span>체력: {player.health}</span>
            <span>스테이지: {player.currentStage}</span>
            <button className="logout-button" onClick={onLogout}>
                로그아웃
            </button>
        </div>
    );
}

export default StatusBar;
