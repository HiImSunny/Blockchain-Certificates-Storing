import React from 'react';

const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-neutral-dark">
                    {label}
                    {required && <span className="text-primary ml-1">*</span>}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`
          px-4 py-2 border-2 border-neutral-dark
          bg-white text-neutral-dark
          placeholder:text-neutral-gray
          focus:outline-none focus:border-primary
          disabled:bg-neutral-beige disabled:cursor-not-allowed
          transition-colors duration-200
          ${error ? 'border-red-500' : ''}
        `}
                {...props}
            />
            {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
    );
};

export default Input;
