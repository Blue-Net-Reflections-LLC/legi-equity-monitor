interface FilterTagProps {
  id: string;
  label: string;
  onRemove: () => void;
  className?: string;
}

export function FilterTag(props: FilterTagProps): JSX.Element; 