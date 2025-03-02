import React from 'react';
import './StatusBar.css';

function StatusBar({ player, onLogout }) {
    if (!player) {
        return (
            <div className="status-bar">
                <span>플레이어 데이터를 로딩 중</span>
            </div>
        );
    }

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
