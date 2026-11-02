import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";

/**
 * Chottu's face. A drawn placeholder until there is a real mascot asset; its
 * colours are the mascot's own, not theme tokens, so they stay put in dark mode.
 */
export function ChottuAvatar({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <Defs>
        <RadialGradient id="chottu-avatar-fill" cx="35%" cy="30%" r="75%">
          <Stop offset="0%" stopColor="#fff4e6" />
          <Stop offset="100%" stopColor="#f2c99a" />
        </RadialGradient>
      </Defs>
      <Circle cx={20} cy={20} r={19} fill="url(#chottu-avatar-fill)" />
      <Circle cx={15} cy={19} r={1.8} fill="#3b2a1a" />
      <Circle cx={25} cy={19} r={1.8} fill="#3b2a1a" />
      <Circle cx={12.5} cy={23.5} r={2.2} fill="#f4a3a3" opacity={0.55} />
      <Circle cx={27.5} cy={23.5} r={2.2} fill="#f4a3a3" opacity={0.55} />
      <Path d="M17.5 24.5q2.5 2.2 5 0" stroke="#3b2a1a" strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
