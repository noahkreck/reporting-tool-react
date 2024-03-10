import React from 'react';

const SidebarToggle = ({ isSidebarVisible, toggleSidebar }) => (
    <button className={`sidebar-toggle ${isSidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`} onClick={toggleSidebar} aria-label="Toggle sidebar">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            {isSidebarVisible ? (
                <path d="M15 19l-8-7 8-7v14z"/> // Left-facing arrow
            ) : (
                <path d="M9 5l8 7-8 7V5z"/> // Right-facing arrow
            )}
        </svg>
    </button>
);

export default SidebarToggle;