import React, { useEffect, useState } from 'react';
import './Store.css';

function Store({ onBack }) {
    const [items, setItems] = useState([]);
    const [category, setCategory] = useState('SKIN');
    const [playerData, setPlayerData] = useState(null);
    const [cart, setCart] = useState([]);
    const [ownedItems, setOwnedItems] = useState([]);

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
                    setOwnedItems(data.ownedItems || []); // 보유 중인 아이템 설정
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

    const handlePurchase = async () => {
        const token = localStorage.getItem('token');
        try {
            for (const item of cart) {
                const response = await fetch(
                    `http://localhost:8080/api/players/purchase-item?itemId=${item.id}&currencyType=${item.currencyType}`,
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
                    setPlayerData(updatedPlayer);
                    setOwnedItems(updatedPlayer.ownedItems || []);
                    alert(`${item.name} 구매 성공!`);
                } else {
                    alert(`${item.name} 구매 실패`);
                }
            }
            setCart([]); // 장바구니 비우기
        } catch (error) {
            console.error('Error during purchase:', error.message || JSON.stringify(error));
        }
    };

    const handleAddToCart = (item, currencyType) => {
        if (cart.some((cartItem) => cartItem.id === item.id)) {
            alert('이미 장바구니에 있는 아이템입니다.');
            return;
        }
        setCart([...cart, { ...item, currencyType }]);
    };

    const filteredItems = items.filter((item) => item.itemType === category);
    const nonOwnedItems = filteredItems.filter((item) => !ownedItems.some((ownedItem) => ownedItem.id === item.id));

    if (!playerData) return <div>Loading...</div>;

    return (
        <div className="store-container">
            <div className="store-header">
                <h1>Store</h1>
                <div className="player-stats">
                    <h3>Gold: {playerData.gold}</h3>
                    <h3>Diamonds: {playerData.diamond}</h3>
                </div>
            </div>
            <div className="store-menu">
                <button onClick={() => setCategory('SKIN')}>Skins</button>
                <button onClick={() => setCategory('SKILL')}>Skills</button>
                <button onClick={onBack}>Back</button>
            </div>
            <div className="store-items">
                <h2>{category === 'SKIN' ? 'Skins' : 'Skills'}</h2>
                {nonOwnedItems.map((item) => (
                    <div key={item.id} className="store-item">
                        <h3>{item.name}</h3>
                        <p>Gold: {item.requiredGold > 0 ? item.requiredGold : 'N/A'}</p>
                        <p>Diamond: {item.requiredDiamond > 0 ? item.requiredDiamond : 'N/A'}</p>
                        <button
                            onClick={() => handleAddToCart(item, 'GOLD')}
                            disabled={playerData.gold < item.requiredGold || item.requiredGold === 0}
                        >
                            Add to Cart (Gold)
                        </button>
                        <button
                            onClick={() => handleAddToCart(item, 'DIAMOND')}
                            disabled={playerData.diamond < item.requiredDiamond || item.requiredDiamond === 0}
                        >
                            Add to Cart (Diamond)
                        </button>
                    </div>
                ))}
                {ownedItems.map((item) => (
                    <div key={item.id} className="store-item owned">
                        <h3>{item.name} (Owned)</h3>
                    </div>
                ))}
            </div>
            <div className="store-cart">
                <h2>Cart</h2>
                {cart.length > 0 ? (
                    <div>
                        {cart.map((item, index) => (
                            <div key={index} className="cart-item">
                                <span>
                                    {item.name} ({item.currencyType})
                                </span>
                            </div>
                        ))}
                        <button onClick={handlePurchase}>Purchase</button>
                    </div>
                ) : (
                    <p>Cart is empty</p>
                )}
            </div>
        </div>
    );
}

export default Store;
