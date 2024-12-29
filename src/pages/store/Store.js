import React, { useEffect, useState } from 'react';

function Store({ onBack }) {
    const [items, setItems] = useState([]); // 모든 아이템 목록
    const [category, setCategory] = useState('SKIN'); // 선택된 카테고리 (SKIN / SKILL)
    const [playerData, setPlayerData] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/items');
                if (response.ok) {
                    const data = await response.json();
                    setItems(data);
                } else {
                    console.error('Failed to fetch items');
                }
            } catch (error) {
                console.error('Error fetching items:', error.message || JSON.stringify(error));
            }
        };

        const fetchPlayerData = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://localhost:8080/api/players/load', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setPlayerData(data);
                } else {
                    console.error('Failed to fetch player data');
                }
            } catch (error) {
                console.error('Error fetching player data:', error.message || JSON.stringify(error));
            }
        };

        fetchItems();
        fetchPlayerData();
    }, []);

    const handlePurchase = async (itemId, currencyType) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(
                `http://localhost:8080/api/players/purchase-item?itemId=${itemId}&currencyType=${currencyType}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (response.ok) {
                const updatedPlayer = await response.json();
                alert('Purchase successful!');
                setPlayerData(updatedPlayer);
            } else {
                alert('Purchase failed');
            }
        } catch (error) {
            console.error('Error during purchase:', error.message || JSON.stringify(error));
        }
    };

    const filteredItems = items.filter((item) => item.itemType === category);

    if (!playerData) return <div>Loading...</div>;

    return (
        <div>
            <h1>Store</h1>
            <div>
                <button onClick={() => setCategory('SKIN')}>Skins</button>
                <button onClick={() => setCategory('SKILL')}>Skills</button>
                <button onClick={onBack}>Back</button>
            </div>
            <h2>{category === 'SKIN' ? 'Skins' : 'Skills'}</h2>
            <div>
                {filteredItems.map((item) => (
                    <div key={item.id} style={{ border: '1px solid black', padding: '10px', margin: '10px' }}>
                        <h3>{item.name}</h3>
                        <p>Gold: {item.requiredGold > 0 ? item.requiredGold : 'N/A'}</p>
                        <p>Diamond: {item.requiredDiamond > 0 ? item.requiredDiamond : 'N/A'}</p>
                        <button
                            onClick={() => handlePurchase(item.id, 'GOLD')}
                            disabled={playerData.gold < item.requiredGold || item.requiredGold === 0}
                        >
                            Buy with Gold
                        </button>
                        <button
                            onClick={() => handlePurchase(item.id, 'DIAMOND')}
                            disabled={playerData.diamond < item.requiredDiamond || item.requiredDiamond === 0}
                        >
                            Buy with Diamond
                        </button>
                    </div>
                ))}
            </div>
            <h3>Your Gold: {playerData.gold}</h3>
            <h3>Your Diamonds: {playerData.diamond}</h3>
        </div>
    );
}

export default Store;
