import React, { useEffect, useState } from 'react';
import './Store.css';
import GoldBarImage from './images/GoldBar.png';

function Store({ onBack, pixiContainer, updatePlayerData }) {
    const [items, setItems] = useState([]);
    const [playerStats, setPlayerStats] = useState({ gold: 0, diamond: 0 });
    const [category, setCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [popup, setPopup] = useState({ show: false, message: '', success: false });
    const ITEMS_PER_PAGE = 6;

    useEffect(() => {
        if (pixiContainer?.current) {
            pixiContainer.current.style.display = 'none';
        }

        const currentPixiContainer = pixiContainer?.current;

        return () => {
            if (currentPixiContainer) {
                currentPixiContainer.style.display = 'block';
            }
        };
    }, [pixiContainer]);

    const fetchItems = async () => {
        try {
            const token = localStorage.getItem('token');
            const itemsResponse = await fetch('http://localhost:8080/api/items', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const ownedItemsResponse = await fetch('http://localhost:8080/api/players/items', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (itemsResponse.ok && ownedItemsResponse.ok) {
                const items = await itemsResponse.json();
                const ownedItems = await ownedItemsResponse.json();

                const ownedItemIds = new Set(ownedItems.map((item) => item.id));

                const sortedItems = items
                    .map((item) => ({
                        ...item,
                        owned: ownedItemIds.has(item.id),
                        imageUrl: `/ingameItem/${item.name}.png`,
                    }))
                    .sort((a, b) => a.owned - b.owned);

                setItems(sortedItems);
            } else {
                console.error('아이템 관련 정보 불러오기 실패');
            }
        } catch (error) {
            console.error('아이템 관련 정보 불러오기 실패', error);
        }
    };

    const fetchPlayerStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/players/load', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const player = await response.json();
                setPlayerStats({ gold: player.gold, diamond: player.diamond });
            } else {
                console.error('플레이어 정보 불러오기 실패', response.status);
            }
        } catch (error) {
            console.error('플레이어 정보 불러오기 실패', error);
        }
    };

    useEffect(() => {
        fetchItems();
        fetchPlayerStats();
    }, []);

    const handlePurchase = async (itemId, currencyType) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:8080/api/items/purchase?itemId=${itemId}&currencyType=${currencyType}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const updatedPlayer = await response.json();

                setPlayerStats({ gold: updatedPlayer.gold, diamond: updatedPlayer.diamond });
                fetchItems();

                updatePlayerData();

                setPopup({ show: true, message: '구매 성공!', success: true });
            } else {
                const errorData = await response.json();
                if (errorData.message) {
                    setPopup({ show: true, message: `${errorData.message}`, success: false });
                } else {
                    setPopup({ show: true, message: '구매 실패! 다시 시도해주세요', success: false });
                }
            }
        } catch (error) {
            console.error('구매 중 오류 발생:', error);
            setPopup({ show: true, message: '구매 오류 발생! 다시 시도해주세요', success: false });
        }
    };

    const splitText = (text, maxLineLength) => {
        const words = text.split(' ');
        let line1 = '';
        let line2 = '';

        for (let word of words) {
            if ((line1 + word).length <= maxLineLength) {
                line1 += (line1 ? ' ' : '') + word;
            } else {
                line2 += (line2 ? ' ' : '') + word;
            }
        }

        return { line1, line2 };
    };

    const filteredItems = category === 'ALL' ? items : items.filter((item) => item.itemType === category);
    const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    return (
        <div className={`new-store-container ${popup.show ? 'disabled' : ''}`}>
            <header className="store-header">
                <h1>Store</h1>
                <button className="back-button" onClick={onBack} disabled={popup.show}>
                    Back
                </button>
            </header>

            <div className="store-tabs">
                <button
                    className={category === 'ALL' ? 'active-tab' : ''}
                    onClick={() => setCategory('ALL')}
                    disabled={popup.show}
                >
                    All
                </button>
                <button
                    className={category === 'SKIN' ? 'active-tab' : ''}
                    onClick={() => setCategory('SKIN')}
                    disabled={popup.show}
                >
                    Skins
                </button>
                <button
                    className={category === 'SKILL' ? 'active-tab' : ''}
                    onClick={() => setCategory('SKILL')}
                    disabled={popup.show}
                >
                    Skills
                </button>
                <button
                    className={category === 'EQUIPMENT' ? 'active-tab' : ''}
                    onClick={() => setCategory('EQUIPMENT')}
                    disabled={popup.show}
                >
                    Equipment
                </button>
            </div>

            <div className="store-items">
                {paginatedItems.map((item) => {
                    const { line1, line2 } = splitText(item.description, 20);
                    return (
                        <div key={item.id} className="store-item">
                            <img src={item.imageUrl} alt={item.displayName} className="item-image" />
                            <h3>{item.displayName}</h3>
                            <p className="item-description">
                                {line1}
                                <br />
                                {line2}
                            </p>
                            {item.owned ? (
                                <span className="owned-label">보유중</span>
                            ) : (
                                <div className="purchase-buttons">
                                    {item.requiredDiamond > 0 && (
                                        <button
                                            className="buy-button"
                                            onClick={() => handlePurchase(item.id, 'DIAMOND')}
                                        >
                                            💎 {item.requiredDiamond}
                                        </button>
                                    )}
                                    {item.requiredGold > 0 && (
                                        <button className="buy-button" onClick={() => handlePurchase(item.id, 'GOLD')}>
                                            <img src={GoldBarImage} alt="Gold" className="currency-icon" />
                                            {item.requiredGold}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="pagination">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || popup.show}
                >
                    &lt; 이전
                </button>
                <span>
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || popup.show}
                >
                    다음 &gt;
                </button>
            </div>

            {popup.show && (
                <div className="popup-container">
                    <div className={`popup ${popup.success ? 'success' : 'error'}`}>
                        <p>{popup.message}</p>
                        <button onClick={() => setPopup({ show: false, message: '', success: false })}>닫기</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Store;
