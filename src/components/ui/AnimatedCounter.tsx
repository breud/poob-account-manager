import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

interface Props {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  delay?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 1200,
  delay = 0,
  className = '',
}: Props) {
  const count = useAnimatedCounter(value, duration, delay);
  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}
