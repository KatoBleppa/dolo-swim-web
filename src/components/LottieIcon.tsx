// src/components/LottieIcon.tsx

import Lottie from 'lottie-react';

type Props = {
  animationData: object;
  width?: number;
  loop?: boolean;
  autoplay?: boolean;
};

const LottieIcon = ({ animationData, width = 180, loop = true, autoplay = true }: Props) => (
  <div style={{ width }}>
    <Lottie animationData={animationData} loop={loop} autoplay={autoplay} />
  </div>
);

export default LottieIcon;

