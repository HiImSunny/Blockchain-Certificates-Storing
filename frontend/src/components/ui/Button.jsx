import React from 'react';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    type = 'button',
    className = '',
    ...props
}) => {
    const baseStyles = 'px-6 py-2 border-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary text-white border-primary hover:bg-primary-dark hover:border-primary-dark',
        secondary: 'bg-white text-neutral-dark border-neutral-dark hover:bg-neutral-beige',
        outline: 'bg-transparent text-neutral-dark border-neutral-dark hover:bg-neutral-beige',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
