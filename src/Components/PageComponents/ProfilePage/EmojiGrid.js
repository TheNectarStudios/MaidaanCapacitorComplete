import { useVirtual } from 'react-virtual';
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../../../firebase-config';
import { doc, setDoc } from "firebase/firestore";

const EmojiGrid = ({ totalEmojis = 1000, profileUserId, setShowEmojis, setUserProfileDetails }) => {
    const parentRef = useRef();
    const [emojis, setEmojis] = useState([]);
    const [loadedChunks, setLoadedChunks] = useState(0);
    let chunkSize = 300;
    const emojisPerRow = 7; 

    const loadMoreEmojis = (numberOfEmojis) => {
        const newEmojis = [];
        if(numberOfEmojis){
            chunkSize = numberOfEmojis;
        }
        for (let i = loadedChunks * chunkSize; i < (loadedChunks + 1) * chunkSize && i < totalEmojis; i++) {
            newEmojis.push(`/Assets/Emojis/${i + 1}.svg`);
        }
        setEmojis(prev => [...prev, ...newEmojis]);
        setLoadedChunks(loadedChunks + 1);
    };

    useEffect(() => {
        // Initial load
        loadMoreEmojis(300);
    }, []);

    const rowVirtualizer = useVirtual({
        size: Math.ceil(emojis.length / emojisPerRow),
        parentRef,
        estimateSize: React.useCallback(() => 100, []),
        overscan: 20,
    });

    // Load more emojis when scrolling to the bottom
    useEffect(() => {
        const handleScroll = () => {
            if (parentRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
                console.log(scrollTop,"scrollTop",  scrollHeight, "scrollHeight",clientHeight, "clientHeight",)
                if (scrollTop + clientHeight >= scrollHeight -50) {
                    loadMoreEmojis();
                }
            }
        };

        const parent = parentRef.current;
        parent.addEventListener('scroll', handleScroll);
        return () => parent.removeEventListener('scroll', handleScroll);
    }, [loadedChunks]);


    const handleEmojiClick = async (e) => {
        console.log(e, "emoji clicked");

        await setDoc(doc(db, "children", profileUserId), {
            profileEmoji: e,
        }, { merge: true });

        setShowEmojis(false);
        setUserProfileDetails((prev) => {
            return { ...prev, profileEmoji: e };
        });
        // Update the child doc with the emoji
    }

    /*
return (
    <div className="h-auto overflow-y-auto" ref={parentRef}>
        <div
            style={{
                height: `${rowVirtualizer.totalSize}px`,
                position: 'relative',
                width: '100%',
            }}
        >
            {rowVirtualizer.virtualItems.map(virtualRow => (
                <div
                    key={virtualRow.index}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                        display: 'flex', // Use flex layout to align items in a row
                        flexWrap: 'wrap', // Allow items to wrap to the next line
                        alignContent: 'flex-start' // Align content at the start of the container
                    }}
                >
                    {emojis.slice(virtualRow.index * emojisPerRow, virtualRow.index * emojisPerRow + emojisPerRow).map(emoji => (
                        <img
                            key={emoji}
                            src={emoji}
                            alt="emoji"
                            style={{
                                width: `calc(${100 / emojisPerRow}% - 10px)`,
                                height: 'auto',
                                objectFit: 'contain',
                                margin: '5px',
                            }}
                            onClick={() => handleEmojiClick(emoji)}
                        />
                    ))}
                </div>
            ))}
        </div>
    </div>
);
}

export default EmojiGrid;

*/


    return (
        <div className="h-auto overflow-y-auto" ref={parentRef}>
            <div
                style={{
                    height: `${rowVirtualizer.totalSize}px`,
                    position: 'relative',
                    width: '100%',
                }}
            >
                {rowVirtualizer.virtualItems.map(virtualRow => (
                    <div
                        key={virtualRow.index}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                        }}
                    >
                        {emojis.slice(virtualRow.index * emojisPerRow, virtualRow.index * emojisPerRow + emojisPerRow).map(emoji => (
                            <img
                                key={emoji}
                                src={emoji}
                                alt="emoji"
                                style={{
                                    width: `calc(${100 / emojisPerRow}% - 10px)`,
                                    height: '100%',
                                    objectFit: 'contain',
                                    marginLeft: '5px',
                                    marginRight: '5px',
                                }}
                                onClick={() => handleEmojiClick(emoji)}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EmojiGrid;