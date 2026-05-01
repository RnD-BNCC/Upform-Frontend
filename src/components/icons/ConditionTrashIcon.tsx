type Props = {
  className?: string;
  size?: number;
};

export default function ConditionTrashIcon({
  className = "",
  size = 16,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 2C8.621 2 8.275 2.214 8.106 2.553L7.382 4H4C3.448 4 3 4.448 3 5C3 5.552 3.448 6 4 6V16C4 17.105 4.895 18 6 18H14C15.105 18 16 17.105 16 16V6C16.552 6 17 5.552 17 5C17 4.448 16.552 4 16 4H12.618L11.894 2.553C11.725 2.214 11.379 2 11 2H9ZM8 8C8.552 8 9 8.448 9 9V15C9 15.552 8.552 16 8 16C7.448 16 7 15.552 7 15V9C7 8.448 7.448 8 8 8ZM12 8C12.552 8 13 8.448 13 9V15C13 15.552 12.552 16 12 16C11.448 16 11 15.552 11 15V9C11 8.448 11.448 8 12 8Z"
      />
    </svg>
  );
}
