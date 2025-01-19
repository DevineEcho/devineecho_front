import React, { useEffect, useState } from 'react';
import './Store.css';

function Store({ onBack, pixiContainer }) {
    const [items, setItems] = useState([]);
    const [ownedItems, setOwnedItems] = useState([]); // 사용자가 보유한 아이템
    const [category, setCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
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

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const token = localStorage.getItem('token');
                console.log('Token:', token);
                const itemsResponse = await fetch('http://localhost:8080/api/items', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const ownedItemsResponse = await fetch('http://localhost:8080/api/player/items', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log('Items Response Status:', itemsResponse.status);
                console.log('Owned Items Response Status:', ownedItemsResponse.status);

                if (itemsResponse.ok && ownedItemsResponse.ok) {
                    const items = await itemsResponse.json();
                    const ownedItems = await ownedItemsResponse.json();

                    const ownedItemIds = new Set(ownedItems.map((item) => item.id));

                    // 소유 여부 추가 및 정렬
                    const sortedItems = items
                        .map((item) => ({
                            ...item,
                            owned: ownedItemIds.has(item.id), // 소유 여부
                            imageUrl: `/ingameItem/${item.name}.png`,
                        }))
                        .sort((a, b) => a.owned - b.owned); // 미소유 아이템을 먼저 표시

                    setItems(sortedItems);
                } else {
                    console.error('Failed to fetch items or owned items');
                }
            } catch (error) {
                console.error('Error fetching items or owned items:', error);
            }
        };

        fetchItems();
    }, []);

    const filteredItems = category === 'ALL' ? items : items.filter((item) => item.itemType === category);
    const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    return (
        <div className="new-store-container">
            <header className="store-header">
                <h1>Store</h1>
                <button
                    className="back-button"
                    onClick={() => {
                        console.log('Back button clicked');
                        onBack();
                    }}
                >
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
                            src={item.imageUrl}
                            alt={item.name}
                            className="item-image"
                            style={{ width: '300px', height: '300px' }} // 고정 크기
                        />
                        <h3>{item.name}</h3>
                        <p>Gold: {item.requiredGold}</p>
                        <p>Diamond: {item.requiredDiamond}</p>
                        {item.owned ? (
                            <button disabled className="owned-button">
                                보유중
                            </button>
                        ) : (
                            <button className="buy-button">Buy</button>
                        )}
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
