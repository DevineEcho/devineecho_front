import React, { useEffect, useState } from 'react';
import StatusBar from '../status/StatusBar'; // StatusBar 가져오기
import './Store.css';

function Store({ onBack, playerData, onLogout }) {
    const [items, setItems] = useState([]);
    const [category, setCategory] = useState('SKIN');
    const [ownedItems, setOwnedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);

    const ITEMS_PER_PAGE = 8;

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const token = localStorage.getItem('token'); // JWT 토큰 가져오기
                const response = await fetch('http://localhost:8080/api/items', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`, // 토큰 추가
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setItems(data);
                } else {
                    console.error('Failed to fetch items', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error fetching items:', error.message || JSON.stringify(error));
            }
        };

        fetchItems();

        // ownedItems 데이터 설정
        if (playerData && playerData.ownedItems) {
            setOwnedItems(playerData.ownedItems);
        } else {
            setOwnedItems([]); // 기본값 설정
        }
    }, [playerData]);

    const filteredItems = items.filter((item) => item.itemType === category);
    const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    const handleAddToCart = (item, currencyType) => {
        if (playerData[currencyType.toLowerCase()] < item[`required${currencyType}`]) {
            alert(`${currencyType}가 부족합니다.`);
            return;
        }
        alert(`${item.name} 구매 성공!`);
        setSelectedItem(item);
    };

    if (!playerData) return <div>Loading...</div>;

    return (
        <div className="store-container">
            {/* 상단 상태 표시줄 */}
            <StatusBar player={playerData} onLogout={onLogout} />

            {/* 카테고리 탭 */}
            <div className="store-tabs">
                <button
                    className={category === 'SKIN' ? 'active-tab' : ''}
                    onClick={() => {
                        setCategory('SKIN');
                        setCurrentPage(1);
                    }}
                >
                    Skins
                </button>
                <button
                    className={category === 'SKILL' ? 'active-tab' : ''}
                    onClick={() => {
                        setCategory('SKILL');
                        setCurrentPage(1);
                    }}
                >
                    Skills
                </button>
                <button onClick={onBack}>Back</button>
            </div>

            {/* 아이템 미리보기 및 목록 */}
            <div className="store-content">
                {/* 선택된 아이템 미리보기 */}
                <div className="item-preview">
                    {selectedItem ? (
                        <div>
                            <img src={selectedItem.imageUrl} alt={selectedItem.name} className="preview-image" />
                            <h3>{selectedItem.name}</h3>
                            <p>Gold: {selectedItem.requiredGold}</p>
                            <p>Diamond: {selectedItem.requiredDiamond}</p>
                        </div>
                    ) : (
                        <p>아이템을 선택하세요</p>
                    )}
                </div>

                {/* 아이템 목록 */}
                <div className="store-items">
                    {paginatedItems.map((item) => (
                        <div
                            key={item.id}
                            className={`store-item ${ownedItems.some((owned) => owned.id === item.id) ? 'owned' : ''}`}
                        >
                            <img src={item.imageUrl} alt={item.name} className="item-image" />
                            <h3>{item.name}</h3>
                            <p>Gold: {item.requiredGold}</p>
                            <p>Diamond: {item.requiredDiamond}</p>
                            <button
                                onClick={() => handleAddToCart(item, 'Gold')}
                                disabled={playerData.gold < item.requiredGold}
                            >
                                Buy with Gold
                            </button>
                            <button
                                onClick={() => handleAddToCart(item, 'Diamond')}
                                disabled={playerData.diamond < item.requiredDiamond}
                            >
                                Buy with Diamond
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 페이지네이션 */}
            <div className="pagination">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    &lt;
                </button>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    &gt;
                </button>
            </div>
        </div>
    );
}

export default Store;
