import { twMerge } from "tailwind-merge";

const AppRadio = ({ label, name = '', value, onChange, id, className, ...rest }) => {
    return (
        <div className="flex">
            <input
              id={id}
              name={name ?? id}
              type="radio"
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

export default AppRadio;