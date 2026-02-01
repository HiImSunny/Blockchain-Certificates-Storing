import React from 'react';

const Card = ({ children, title, className = '', ...props }) => {
    return (
        <div
            className={`border-2 border-neutral-dark bg-white p-6 ${className}`}
            {...props}
        >
            {title && (
                <h3 className="text-xl font-bold text-neutral-dark mb-4 pb-2 border-b border-neutral-gray">
                    {title}
                </h3>
            )}
            {children}
        </div>
    );
};

export default Card;
