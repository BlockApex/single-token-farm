type Props = {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export const If: React.FC<Props> = ({
  children,
  condition,
  fallback = null,
}) => {
  return <>{condition ? children : fallback || null}</>;
};
