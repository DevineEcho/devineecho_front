import React, { useEffect, useState } from 'react';
import StatusBar from '../status/StatusBar'; // 스테이터스바 추가
import './Store.css';

function Store({ onBack, playerData, onLogout, pixiContainer }) {
    const [items, setItems] = useState([]);
    const [category, setCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    // Pixi 컨테이너 숨기기
    useEffect(() => {
        if (pixiContainer && pixiContainer.current) {
            pixiContainer.current.style.display = 'none';
        }
        return () => {
            if (pixiContainer && pixiContainer.current) {
                pixiContainer.current.style.display = 'block';
            }
        };
    }, [pixiContainer]);

    // 아이템 가져오기
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8080/api/items', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
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
    }, []);

    // 카테고리별 필터링
    const filteredItems = category === 'ALL' ? items : items.filter((item) => item.itemType === category);

    const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    return (
        <div className="new-store-container">
            {/* 스테이터스 바 추가 */}
            <StatusBar player={playerData} onLogout={onLogout} />

            <header className="store-header">
                <h1>Store</h1>
                <button className="back-button" onClick={onBack}>
                    Back
                </button>
            </header>

            <div className="store-tabs">
                <button className={category === 'ALL' ? 'active-tab' : ''} onClick={() => setCategory('ALL')}>
                    All
                </button>
                <button className={category === 'SKIN' ? 'active-tab' : ''} onClick={() => setCategory('SKIN')}>
                    Skins
                </button>
                <button className={category === 'SKILL' ? 'active-tab' : ''} onClick={() => setCategory('SKILL')}>
                    Skills
                </button>
                <button
                    className={category === 'EQUIPMENT' ? 'active-tab' : ''}
                    onClick={() => setCategory('EQUIPMENT')}
                >
                    Equipment
                </button>
            </div>

            <div className="store-items">
                {paginatedItems.map((item) => (
                    <div key={item.id} className="store-item">
                        <img
                            src={item.imageUrl || 'https://via.placeholder.com/150'}
                            alt={item.name}
                            className="item-image"
                        />
                        <h3>{item.name}</h3>
                        <p>Gold: {item.requiredGold}</p>
                        <p>Diamond: {item.requiredDiamond}</p>
                        <button>Buy</button>
                    </div>
                ))}
                {paginatedItems.length === 0 && <p>No items found</p>}
            </div>

            <div className="pagination">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    &lt; Previous
                </button>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next &gt;
                </button>
            </div>
        </div>
    );
}

export default Store;
