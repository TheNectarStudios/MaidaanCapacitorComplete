import { twMerge } from "tailwind-merge";

const AppCheckbox = ({ label, name = '', value, onChange, id, className = '', containerClassName = '', ...rest }) => {
    return (
        <div className={twMerge("flex", containerClassName)}>
            <input
              id={id}
              name={name ?? id}
              type="checkbox"
              className={twMerge("h-4 w-4 accent-primary-yellow", className)}
              value={value}
              onChange={onChange}
              {...rest}
            />
            <label htmlFor={id}>
                {label}
            </label>
        </div>
    );
};

export default AppCheckbox;